import os
import random
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes, CommandHandler
from dotenv import load_dotenv

# Load internal services
from app.services.langchain_service import get_chat_response

# Load environment variables
load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

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

def generate_response(user_message: str, system_context: str = None) -> str:
    """
    Bridge to the internal CareerSpark AI chat engine.
    """
    try:
        if system_context:
            prompt = f"{system_context}\n\nCandidate Answer:\n{user_message}"
        else:
            prompt = user_message

        messages = [{"role": "user", "content": prompt}]
        result = get_chat_response(messages)
        return result.get("response", "I'm sorry, I'm having trouble processing that right now.")
    except Exception as e:
        print(f"[TelegramBot] Error generating AI response: {e}")
        return "I encountered an error connecting to the AI Coach. Please try again later."

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Callback for /start command."""
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
    
    user_sessions[user_id] = {"current_question": question}
    
    await update.message.reply_text(
        "🧠 *Interview Practice*\n\n"
        f"Question:\n*{question}*\n\n"
        "Send your answer and I will evaluate it.",
        parse_mode='Markdown'
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Main entry point for all incoming messages.
    Ensures commands are handled first before intent detection.
    """
    if not update.message or not update.message.text:
        return

    user_id = update.effective_user.id
    message = update.message.text.strip()

    # ---- COMMAND HANDLING FIRST ----
    if message.startswith("/practice"):
        await practice_command(update, context)
        return

    if message.startswith("/help"):
        await help_command(update, context)
        return

    if message.startswith("/start"):
        await start_command(update, context)
        return

    # ---- SESSION HANDLING (INTERVIEW PRACTICE) ----
    session = user_sessions.get(user_id)
    
    if session and "current_question" in session:
        question = session["current_question"]
        print(f"[TelegramBot] Evaluating practice answer from {update.effective_user.first_name}")
        
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
        
        ai_response = generate_response(message, system_context)
        
        # Clear the session after evaluation
        user_sessions.pop(user_id, None)
        
        await update.message.reply_text(f"✅ *Interview Feedback*\n\n{ai_response}", parse_mode='Markdown')
        return

    # ---- NORMAL CHAT / AI COACH ----
    print(f"[TelegramBot] Chat message from {update.effective_user.first_name}: {message}")
    ai_response = generate_response(message)
    await update.message.reply_text(ai_response)

def start_bot():
    """Build and run the Telegram Application."""
    if not TOKEN:
        print("ERROR:     TELEGRAM_BOT_TOKEN not found in environment variables.")
        return

    app = ApplicationBuilder().token(TOKEN).build()

    # Unified handler for all text (Detects/Prioritizes commands manually)
    app.add_handler(MessageHandler(filters.TEXT, handle_message))

    print("INFO:     Telegram bot started with Command Priority logic...")
    app.run_polling()
