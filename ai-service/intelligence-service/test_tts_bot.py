import asyncio
import os
import sys

# Ensure intelligence-service is in sys.path
sys.path.append(os.getcwd())

from app.services.tts_service import tts_service

async def test_tts():
    print("Testing TTS generation...")
    text = "Hello, I am your CareerSpark AI coach. How can I help you today?"
    try:
        ogg_path = await tts_service.generate_tts(text, lang="en")
        print(f"TTS generated successfully: {ogg_path}")
        if os.path.exists(ogg_path):
            print(f"File size: {os.path.getsize(ogg_path)} bytes")
        else:
            print("ERROR: Result path does not exist.")
    except Exception as e:
        print(f"ERROR during TTS: {e}")

if __name__ == "__main__":
    asyncio.run(test_tts())
