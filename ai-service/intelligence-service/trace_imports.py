import time
import sys

def trace_import(name):
    print(f"Importing {name}...", end="", flush=True)
    start = time.time()
    try:
        __import__(name)
        print(f" DONE ({time.time() - start:.2f}s)")
    except Exception as e:
        print(f" FAILED: {e}")

print("Tracing imports in venv...")
trace_import("dotenv")
trace_import("telegram")
trace_import("telegram.ext")
trace_import("app.services.ai_config")
trace_import("app.services.intent_detector")
trace_import("app.services.vector_db_service")
trace_import("app.services.langchain_service")
trace_import("telegram_bot.bot")
