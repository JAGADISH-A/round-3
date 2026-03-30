import os
import random
import asyncio
import time
import logging
from functools import partial
from typing import Optional
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes, CommandHandler
from dotenv import load_dotenv

# Load internal services (Absolute Imports for Package Execution)
from app.services.langchain_service import get_chat_response
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service
from app.services.interview_engine import InterviewEngine, user_sessions

# Configure logging to match [ACTION] format
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def generate_response_async(user_message: str, system_context: Optional[str] = None) -> str:
    """
    Bridge to the internal CareerSpark AI chat engine.
    Runs the blocking LLM call in a thread executor with a strict 6s timeout.
    """
    try:
        # Prompt Optimization (Max 2 sentences, no markdown, speakable only)
        optimization_rules = (
            "\n[STRICT RULES: Max 2-3 sentences. No markdown. Speakable English only.]"
        )
        
        if system_context:
            prompt = f"{system_context}\n{optimization_rules}\n\nCandidate Answer:\n{user_message}"
        else:
            prompt = f"{user_message}\n{optimization_rules}"

        messages = [{"role": "user", "content": prompt}]

        # [LLM] start
        loop = asyncio.get_running_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(None, partial(get_chat_response, messages)),
                timeout=6.0
            )
            # [LLM] result logic inside handle_voice
            return result.get("response", "I'm having trouble processing that right now.")
        except asyncio.TimeoutError:
            logger.warning("[LLM] timeout (6s limit reached)")
            return "I'm sorry, I took too long to think. Please try a shorter question."

    except Exception as e:
        logger.error(f"[ERROR] LLM failed: {e}", exc_info=True)
        return "I encountered an error connecting to the AI Coach."

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /start command."""
    user_id = update.effective_user.id
    InterviewEngine.get_session(user_id)["mode"] = "chat"
    await update.message.reply_text("Welcome! I am your AI Interview Coach. Use /practice to start.")

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /help command."""
    await update.message.reply_text("/practice - Start interview\n/coach - Chat mode\n/help - Help")

async def coach_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /coach command."""
    user_id = update.effective_user.id
    InterviewEngine.get_session(user_id)["mode"] = "chat"
    await update.message.reply_text("Switched to Coach Mode. Ask me anything!")

async def practice_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /practice command."""
    user_id = update.effective_user.id
    personality = context.args[0].lower() if context.args else "technical"
    question = InterviewEngine.start_interview(user_id, personality=personality)
    await update.message.reply_text(f"🧠 *Practice Start ({personality})*\n\n*{question}*", parse_mode='Markdown')

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Universal handler for text messages."""
    try:
        if not update.message or not update.message.text: return
        user_id = update.effective_user.id
        user_message = update.message.text.strip()
        
        if InterviewEngine.is_interview_mode(user_id):
            status_msg = await update.message.reply_text("🤔 *Analyzing...*", parse_mode='Markdown')
            interaction_data = await asyncio.to_thread(InterviewEngine.process_interaction, user_id, user_message)
            await status_msg.delete()
            
            eval_data = interaction_data.get("evaluation", {})
            score = eval_data.get("score", 5)
            next_text = interaction_data.get("next_text", "Let's move on.")
            feedback = f"📊 *Score: {score}/10*\n\n{next_text}"
            await update.message.reply_text(feedback, parse_mode='Markdown')
        else:
            ai_response = await generate_response_async(user_message)
            await update.message.reply_text(ai_response)
    except Exception as e:
        logger.error(f"[ERROR] handle_message: {e}")
        await update.message.reply_text("I'm having trouble right now.")

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Hardened Voice Handler.
    Flow: [VOICE] -> [STT] (5s) -> [LLM] (6s) -> [TTS] (5s) -> [REPLY].
    """
    # [VOICE] received
    logger.info("[VOICE] received")
    
    start_time = time.time()
    try:
        user_id = update.effective_user.id
        
        # 1. Download
        voice_file = await context.bot.get_file(update.message.voice.file_id)
        byte_array = await voice_file.download_as_bytearray()
        audio_stream = bytes(byte_array)
        
        # 2. [STT] (15s)
        try:
            logger.info("[STT] processing")
            user_text = await asyncio.wait_for(
                stt_service.transcribe(audio_stream, "voice.ogg"),
                timeout=15.0
            )
            # [STT] result
            logger.info(f"[STT] result: {user_text}")
        except asyncio.TimeoutError:
            logger.warning("[STT] timeout")
            await update.message.reply_text("I couldn't hear that clearly. Try again.")
            return

        if not user_text or len(user_text.strip()) < 2:
            await update.message.reply_text("I couldn't understand the audio. Please try again.")
            return

        # 3. [LLM] (20s)
        ai_response = ""
        status_msg = await update.message.reply_text("🤖 *Processing request...*", parse_mode='Markdown')
        try:
            if InterviewEngine.is_interview_mode(user_id):
                interaction_data = await asyncio.wait_for(
                    asyncio.to_thread(InterviewEngine.process_interaction, user_id, user_text),
                    timeout=20.0
                )
                ai_response = interaction_data.get("next_text", "Let's move on.")
                eval_data = interaction_data.get("evaluation", {})
                await status_msg.edit_text(f"📊 *Score: {eval_data.get('score', 5)}/10*\n\n{ai_response}", parse_mode='Markdown')
            else:
                ai_response = await asyncio.wait_for(generate_response_async(user_text), timeout=20.0)
                await status_msg.edit_text(ai_response)
            
            logger.info(f"[LLM] {ai_response}")
        except asyncio.TimeoutError:
            logger.warning("[LLM] timeout")
            await status_msg.edit_text("Thinking took too long.")
            return

        # 4. [TTS] (30s)
        try:
            # Inform user that synthesis is happening to manage expectations for the longer wait
            synth_feedback = await update.message.reply_text("🎙️ *Synthesizing response...*")
            await update.message.reply_chat_action(action="record_voice")
            audio_path = await asyncio.wait_for(tts_service.generate_tts(ai_response, lang="en"), timeout=30.0)
            await synth_feedback.delete()
            logger.info("[TTS] generated")
        except asyncio.TimeoutError:
            logger.warning("[TTS] timeout")
            if 'synth_feedback' in locals(): await synth_feedback.delete()
            return
        except Exception as tts_err:
            logger.error(f"[TTS] error: {tts_err}")
            if 'synth_feedback' in locals(): await synth_feedback.delete()
            return

        # 5. [REPLY]
        if audio_path and os.path.exists(str(audio_path)):
            try:
                with open(str(audio_path), 'rb') as audio:
                    await update.message.reply_voice(voice=audio)
                logger.info("[REPLY] sent")
            finally:
                if os.path.exists(str(audio_path)): os.remove(str(audio_path))

    except Exception as e:
        logger.error(f"[ERROR] handle_voice: {e}")
        await update.message.reply_text("Voice pipeline error.")

async def run_bot_async():
    load_dotenv(override=True)
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN missing")
        return

    app = ApplicationBuilder().token(token).build()
    
    # Warmup
    asyncio.create_task(stt_service.warmup())

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("practice", practice_command))
    app.add_handler(CommandHandler("coach", coach_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))

    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    logger.info("BOT ACTIVE")
    while True: await asyncio.sleep(3600)

def start_bot():
    try: asyncio.run(run_bot_async())
    except Exception as e: logger.error(f"Bot exited: {e}")

if __name__ == "__main__":
    start_bot()
