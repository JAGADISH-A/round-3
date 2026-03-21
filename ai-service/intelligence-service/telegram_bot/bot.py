import os
import random
import asyncio
from functools import partial
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes, CommandHandler
from dotenv import load_dotenv

# Load internal services
from app.services.langchain_service import get_chat_response

import logging

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if TOKEN:
    logger.info(f"Loaded Token: {TOKEN[:5]}...{TOKEN[-5:]}")
else:
    logger.error("TELEGRAM_BOT_TOKEN NOT FOUND IN ENV")

# Global session store for interview practice
# Structure: {user_id: {"current_question": str}}
user_sessions = {}

questions = [
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


async def generate_response_async(user_message: str, system_context: str = None) -> str:
    """
    Bridge to the internal CareerSpark AI chat engine.
    Runs the blocking LLM call in a thread executor to avoid freezing the event loop.
    """
    try:
        if system_context:
            prompt = f"{system_context}\n\nCandidate Answer:\n{user_message}"
        else:
            prompt = user_message

        messages = [{"role": "user", "content": prompt}]

        logger.info("[Bot] Dispatching to AI engine (thread executor)...")

        # Run blocking get_chat_response in a thread so we don't block the event loop
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(None, partial(get_chat_response, messages))

        logger.info(f"[Bot] AI engine returned. Keys: {list(result.keys())}")
        return result.get("response", "I'm sorry, I'm having trouble processing that right now.")
    except Exception as e:
        logger.error(f"[Bot] Error generating AI response: {e}", exc_info=True)
        return "I encountered an error connecting to the AI Coach. Please try again later."


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /start command."""
    logger.info(f"[Bot] /start from {update.effective_user.first_name}")
    await update.message.reply_text(
        "Welcome to CareerSpark AI! 🚀\n\n"
        "I am your AI Career Coach. I can help you prepare for interviews, "
        "review your resume, or provide career advice.\n\n"
        "Commands:\n"
        "/practice - Start an interview practice session\n"
        "/coach - Regular chat mode\n"
        "/help - Show all commands"
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /help command."""
    logger.info(f"[Bot] /help from {update.effective_user.first_name}")
    await update.message.reply_text(
        "CareerSpark AI Telegram Bot\n\n"
        "Commands:\n"
        "/practice - Get a random interview question to answer\n"
        "/coach - Ask me any career-related questions\n"
        "/help - Show this help menu"
    )


async def practice_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /practice command."""
    user_id = update.effective_user.id
    question = random.choice(questions)
    logger.info(f"[Bot] /practice from {update.effective_user.first_name} — Q: {question}")

    user_sessions[user_id] = {"current_question": question}

    await update.message.reply_text(
        "🧠 *Interview Practice*\n\n"
        f"Question:\n*{question}*\n\n"
        "Send your answer and I will evaluate it.",
        parse_mode='Markdown'
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handler for all non-command text messages.
    Commands are handled separately by CommandHandler (registered first).
    """
    if not update.message or not update.message.text:
        logger.warning("[Bot] Received update with no message text, skipping.")
        return

    user_id = update.effective_user.id
    message = update.message.text.strip()

    logger.info(f"[Bot] TEXT from {update.effective_user.first_name} (id={user_id}): {message[:80]}")

    # ---- SESSION HANDLING (INTERVIEW PRACTICE) ----
    session = user_sessions.get(user_id)

    if session and "current_question" in session:
        question = session["current_question"]
        logger.info(f"[Bot] Evaluating practice answer from {update.effective_user.first_name}")

        system_context = (
            "You are an AI Interview Coach. Your goal is to evaluate the candidate's answer "
            "to a specific interview question. Be constructive, professional, and encouraging.\n\n"
            f"Interview Question: {question}\n\n"
            "Evaluate the answer based on:\n"
            "- Strengths\n"
            "- Weaknesses\n"
            "- Improvement Advice\n"
            "- Score (out of 10)\n\n"
            "Format the response clearly with bold headers."
        )

        ai_response = await generate_response_async(message, system_context)

        # Clear the session after evaluation
        user_sessions.pop(user_id, None)

        logger.info(f"[Bot] Sending practice feedback ({len(ai_response)} chars)")
        await update.message.reply_text(f"✅ *Interview Feedback*\n\n{ai_response}", parse_mode='Markdown')
        return

    # ---- NORMAL CHAT / AI COACH ----
    logger.info(f"[Bot] Normal chat — calling AI engine...")
    ai_response = await generate_response_async(message)

    logger.info(f"[Bot] Sending chat response ({len(ai_response)} chars)")
    await update.message.reply_text(ai_response)


def start_bot():
    """Build and run the Telegram Application."""
    if not TOKEN:
        logger.error("ERROR: TELEGRAM_BOT_TOKEN not found in environment variables.")
        return

    logger.info("Initializing ApplicationBuilder...")
    app = ApplicationBuilder().token(TOKEN).build()

    # Register command handlers FIRST (higher priority)
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("practice", practice_command))

    # Then register the general text handler (excludes commands)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("Telegram bot starting polling...")
    app.run_polling()


if __name__ == "__main__":
    start_bot()
