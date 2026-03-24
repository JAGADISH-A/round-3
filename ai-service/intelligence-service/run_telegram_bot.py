import os
import sys

# --- BumbleBee AI - Global FFmpeg Environment Injection ---
FFMPEG_BIN = r"C:\ffmpeg\bin"
if FFMPEG_BIN not in os.environ["PATH"]:
    os.environ["PATH"] = FFMPEG_BIN + os.pathsep + os.environ["PATH"]
# ----------------------------------------------------------

from telegram_bot.bot import start_bot

if __name__ == "__main__":
    start_bot()
