import os
import random
import asyncio
from functools import partial
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes, CommandHandler
from dotenv import load_dotenv

# Load internal services
from app.services.langchain_service import get_chat_response
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service

import logging

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Global session store for interview practice
# Structure: {user_id: {"current_question": str}}
user_sessions = {}




from typing import Optional

async def generate_response_async(user_message: str, system_context: Optional[str] = None) -> str:
    """
    Bridge to the internal CareerSpark AI chat engine.
    Runs the blocking LLM call in a thread executor with a strict 8s timeout.
    """
    try:
        # Phase 4: Prompt Optimization (Max 2 sentences, no markdown, speakable only)
        optimization_rules = (
            "\n[STRICT RULES: Max 2 sentences. No markdown. No bullet points. Speakable English only.]"
        )
        
        if system_context:
            prompt = f"{system_context}\n{optimization_rules}\n\nCandidate Answer:\n{user_message}"
        else:
            prompt = f"{user_message}\n{optimization_rules}"

        messages = [{"role": "user", "content": prompt}]

        logger.info("[STEP] LLM start")

        # Run blocking get_chat_response in a thread with a hard timeout of 8 seconds
        loop = asyncio.get_running_loop()
        try:
            result = await asyncio.wait_for(
                loop.run_in_executor(None, partial(get_chat_response, messages)),
                timeout=8.0
            )
        except asyncio.TimeoutError:
            logger.warning("[STEP] LLM timeout (8s limit reached)")
            return "I'm sorry, I took too long to think. Please try asking a shorter question."

        logger.info("[STEP] LLM success")
        return result.get("response", "I'm having trouble processing that right now.")

    except Exception as e:
        logger.error(f"[ERROR] LLM failed: {e}", exc_info=True)
        return "I encountered an error connecting to the AI Coach. Please try again later."


INTERVIEW_QUESTIONS = [
    "Tell me about yourself.",
    "Describe a difficult technical problem you solved.",
    "Explain a backend system you built.",
    "How would you design an API for 10k requests per second?",
    "What is your biggest technical strength?",
    "How do you handle conflict in a team setting?",
    "Where do you see yourself in five years?",
    "Why do you want to work for CareerSpark?",
    "Explain the concept of microservices to a non-technical person.",
    "What is your experience with asynchronous programming?"
]

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /start command."""
    logger.info(f"[Bot] /start from {update.effective_user.first_name}")
    user_sessions[update.effective_user.id] = {"mode": "chat", "history": []}
    await update.message.reply_text(
        "Welcome to CareerSpark AI! 🚀\n\n"
        "I am your AI Interview Coach. I can help you prepare for interviews, "
        "review your resume, or provide career advice.\n\n"
        "Commands:\n"
        "/practice - Start a structured interview session\n"
        "/coach - Regular chat mode\n"
        "/help - Show all commands"
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /help command."""
    logger.info(f"[Bot] /help from {update.effective_user.first_name}")
    await update.message.reply_text(
        "CareerSpark AI Telegram Bot\n\n"
        "Commands:\n"
        "/practice - Start a structured 5-question interview\n"
        "/coach - Ask me any career-related questions\n"
        "/help - Show this help menu"
    )

async def coach_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /coach command."""
    user_id = update.effective_user.id
    user_sessions[user_id] = {"mode": "chat", "history": []}
    await update.message.reply_text("Switched to Coach Mode. Ask me anything about your career!")

async def practice_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /practice command."""
    user_id = update.effective_user.id
    question = random.choice(INTERVIEW_QUESTIONS)
    
    # Initialize Interview Session
    user_sessions[user_id] = {
        "mode": "interview",
        "current_question": question,
        "question_index": 0,
        "history": []
    }
    
    logger.info(f"[INTERVIEW] Session started for {user_id}. Q: {question}")

    await update.message.reply_text(
        "🧠 *Interview Practice Start*\n\n"
        f"I'll ask you 5 questions. Here is your first one:\n\n"
        f"*{question}*",
        parse_mode='Markdown'
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Universal handler for messages with simulator logic."""
    try:
        if not update.message or not update.message.text: return
        
        user_id = update.effective_user.id
        user_message = update.message.text.strip()
        
        if user_id not in user_sessions:
            user_sessions[user_id] = {"mode": "chat", "history": []}
        session = user_sessions[user_id]
        
        logger.info(f"[STEP] Request received (Mode: {session.get('mode')})")

        if session.get("mode") == "interview":
            # PHASE 3: Evaluation Logic
            status_msg = await update.message.reply_text("🤔 *Evaluating your answer...*", parse_mode='Markdown')
            
            question = session["current_question"]
            eval_prompt = (
                "You are an expert technical interviewer.\n"
                f"Question: {question}\n"
                f"Candidate Answer: {user_message}\n\n"
                "Provide a short evaluation with Score (X/10), Strengths, and a 'Better Answer' suggestion.\n"
                "Keep it concise for speech. No markdown symbols except Score line."
            )
            
            evaluation = await generate_response_async(user_message, eval_prompt)
            await status_msg.delete()
            
            # Send Evaluation (Text)
            await update.message.reply_text(f"📊 *Feedback*\n\n{evaluation}", parse_mode='Markdown')
            
            # PHASE 8: TTS Integration (Voice)
            try:
                logger.info("[STEP] TTS start (Evaluation)")
                await update.message.reply_chat_action(action="record_voice")
                audio_path = await tts_service.generate_tts(evaluation, lang="en")
                if audio_path and os.path.exists(str(audio_path)):
                    with open(str(audio_path), 'rb') as audio:
                        await update.message.reply_voice(voice=audio)
                    os.remove(str(audio_path))
                    logger.info("[STEP] TTS feedback sent and cleaned up")
            except Exception as e:
                logger.error(f"[ERROR] TTS feedback failed: {e}")

            # PHASE 4: Next Question logic
            idx_val = session.get("question_index", 0)
            idx = int(idx_val) if isinstance(idx_val, (int, str)) else 0
            idx += 1
            session["question_index"] = idx
            
            if idx >= 5:
                await update.message.reply_text("🏁 *Interview Complete!*\n\nYou've done a great job. Send /practice to start again or /coach for regular chat.")
                session["mode"] = "chat"
            else:
                next_q = random.choice(INTERVIEW_QUESTIONS)
                session["current_question"] = next_q
                await update.message.reply_text(f"Next Question ({idx+1}/5):\n\n*{next_q}*", parse_mode='Markdown')
        else:
            # NORMAL COACH MODE
            status_msg = await update.message.reply_text("Thinking...")
            ai_response = await generate_response_async(user_message)
            await status_msg.edit_text(ai_response)

        logger.info("[STEP] Request complete")

    except Exception as e:
        logger.error(f"[ERROR] handle_message: {e}", exc_info=True)
        await update.message.reply_text("I'm having trouble right now. Let's continue.")

async def handle_unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Fallback handler for anything that isn't text, voice, or a registered command."""
    if update.message:
        logger.info("MESSAGE RECEIVED")
        logger.warning(f"[Bot] Received unknown/unsupported message type from {update.effective_user.first_name}")
        await update.message.reply_text(f"⚠️ I received a message type I don't support (like a photo, document, or sticker). Please send text or voice notes.")


import time

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler for Voice notes.
    PHASE 5 & 6: Hardened TTS flow with latency protection.
    """
    start_time = time.time()
    try:
        logger.info("[STEP] Request received (VOICE)")
        user_id = update.effective_user.id
        
        # Phase 8: STT is currently disabled
        logger.info("[Bot] STT is disabled. Using fallback text for TTS test.")
        
        # 1. AI Logic (Mocked text since STT is off)
        ai_response = "I've received your voice note. My speech pipeline is now hardened."
        
        # 2. TTS Protection (Phase 6)
        elapsed = time.time() - start_time
        if elapsed > 8.0:
            logger.warning(f"[STEP] Skipping TTS due to latency ({elapsed:.2f}s)")
            await update.message.reply_text(ai_response)
            return

        # 3. TTS Generation (Phase 5)
        logger.info("[STEP] TTS start")
        await update.message.reply_chat_action(action="record_voice")
        
        audio_path = await tts_service.generate_tts(ai_response, lang="en")
        logger.info(f"[STEP] TTS complete: {audio_path}")

        # 4. Send and Cleanup
        try:
            with open(audio_path, 'rb') as audio:
                await update.message.reply_voice(
                    voice=audio, 
                    caption=ai_response[:1024]
                )
            logger.info("[STEP] Voice file sent")
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)
                logger.info(f"[STEP] Cleaned up: {audio_path}")

        logger.info("[STEP] Request complete")

    except Exception as e:
        logger.error(f"[ERROR] handle_voice failed: {e}", exc_info=True)
        await update.message.reply_text("I encountered an error processing your voice. Please try typing.")


async def run_bot_async():
    """Build and run the Telegram Application via an explicit async lifecycle."""
    load_dotenv(override=True)
    token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not token:
        logger.error("CRITICAL: TELEGRAM_BOT_TOKEN not found in environment variables.")
        # We don't exit in case of transient local issues, but we warn heavily
        while True:
            logger.error("Bot is asleep because TELEGRAM_BOT_TOKEN is missing. Please set it in .env")
            await asyncio.sleep(60)

    logger.info(f"Initializing ApplicationBuilder with token: {str(token)[:4]}...{str(token)[-4:]}")
    app = ApplicationBuilder().token(token).build()

    # Register command handlers FIRST (higher priority)
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("practice", practice_command))
    app.add_handler(CommandHandler("coach", coach_command))

    # Then register the general text handler (excludes commands)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Register the voice handler
    app.add_handler(MessageHandler(filters.VOICE, handle_voice))

    # Catch-all for anything else (Photos, Documents, Stickers, etc)
    app.add_handler(MessageHandler(filters.ALL & ~filters.TEXT & ~filters.VOICE & ~filters.COMMAND, handle_unknown))

    logger.info("1. Initialize app lifecycle")
    await app.initialize()
    logger.info("2. Start app lifecycle")
    await app.start()
    
    logger.info("3. Start polling with drop_pending_updates=True")
    await app.updater.start_polling(drop_pending_updates=True)
    
    logger.info("BOT ACTIVE AND LISTENING")
    
    try:
        # Keep alive loop
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        logger.warning("Bot received cancel instruction. Shutting down gracefully...")
    except KeyboardInterrupt:
        logger.warning("Bot received keyboard interrupt. Shutting down gracefully...")
    finally:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()
        logger.info("Bot properly shutdown.")

def start_bot():
    try:
        asyncio.run(run_bot_async())
    except KeyboardInterrupt:
        logger.info("Bot process killed by user.")
    except Exception as e:
        logger.error(f"Bot exited with unknown error: {e}", exc_info=True)

if __name__ == "__main__":
    start_bot()
