import os
import tempfile
import uuid
import edge_tts
import re

# ─── TTS Speech Rules & Sanitizer ─────────────────────────────────────────────

# Rules injected into system prompts to shape speech-ready output
TTS_SPEECH_RULES = (
    "\nSPEECH OUTPUT RULES (CRITICAL):\n"
    "1. Always produce COMPLETE responses. Never cut off mid-sentence.\n"
    "2. Do NOT use markdown formatting (no **, #, bullet dashes, or dots in lists).\n"
    "3. No code blocks, symbols (*, #, >), or URLs.\n"
    "4. Use clear punctuation (., ?) for natural pauses.\n"
    "5. Keep sentences concise (15-25 words).\n"
    "6. Respond in plain conversational prose only.\n"
    "7. End with a complete concluding sentence."
)

def sanitize_for_tts(text: str) -> str:
    """Strip markdown and formatting artifacts for clean TTS playback."""
    if not text: return ""

    # Strip code blocks and inline code
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`[^`]+`', '', text)

    # Strip markdown headers, bold, italic
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', text)
    text = re.sub(r'_{1,2}([^_]+)_{1,2}', r'\1', text)

    # Strip URLs and links
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    text = re.sub(r'https?://\S+', '', text)

    # Strip list markers and blockquotes
    text = re.sub(r'^[-*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\d+\.\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)

    # Strip tables and emoji
    text = re.sub(r'[|]', ' ', text)
    text = re.sub(r'-{2,}', ' ', text)
    text = re.sub(r'[\U0001F300-\U0001F9FF\U00002600-\U000027BF]+', '', text)

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

class TTSService:
    _instance = None

    # Selected voices for BumbleBee AI — India locale for natural pronunciation
    VOICES = {
        "en": "en-IN-PrabhatNeural",
        "ta": "ta-IN-PallaviNeural"
    }

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TTSService, cls).__new__(cls)
        return cls._instance

    def is_active(self):
        """Edge-TTS is always active as it's a lightweight library."""
        return True

    async def generate_tts(self, text: str, lang: str) -> str:
        """
        Generates TTS using edge-tts, converts to .ogg (opus), and returns the file path.
        """
        import logging
        import subprocess
        import imageio_ffmpeg as ffmpeg
        logger = logging.getLogger(__name__)
        
        voice = self.VOICES.get(lang, self.VOICES["en"])
        clean_text = sanitize_for_tts(text)
        if not clean_text:
            clean_text = "I am sorry, I have nothing to say."
            
        # Ensure temporary directory exists
        temp_dir = os.path.join(tempfile.gettempdir(), "bumblebee_tts")
        os.makedirs(temp_dir, exist_ok=True)
        
        base_id = str(uuid.uuid4())
        mp3_path = os.path.join(temp_dir, f"{base_id}.mp3")
        ogg_path = os.path.join(temp_dir, f"{base_id}.ogg")
        
        try:
            # Step 1: Generate MP3
            logger.info(f"[TTS] generation start: {len(clean_text)} chars")
            communicate = edge_tts.Communicate(clean_text, voice)
            await communicate.save(mp3_path)
            logger.info(f"[TTS] generation complete: {mp3_path}")
            
            # Step 2: Convert to OGG (Opus) for Telegram optimization
            if not os.path.exists(mp3_path) or os.path.getsize(mp3_path) == 0:
                raise Exception("MP3 generation failed or file is empty")
                
            ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
            logger.info(f"[TTS] converting to ogg: {ogg_path}")
            
            # libopus at 64k is high quality and very efficient for Telegram
            command = [
                ffmpeg_exe, "-y", "-i", mp3_path,
                "-c:a", "libopus", "-b:a", "64k",
                ogg_path
            ]
            
            # Run conversion synchronously in a thread to avoid blocking loop
            import asyncio
            def run_ffmpeg():
                return subprocess.run(command, check=True, capture_output=True)
                
            await asyncio.to_thread(run_ffmpeg)
            logger.info(f"[TTS] converted to ogg successfully")
            
            # Step 3: Cleanup MP3 immediately
            if os.path.exists(mp3_path):
                os.remove(mp3_path)
                
            return ogg_path
            
        except Exception as e:
            logger.error(f"[TTS] Error during generation/conversion: {e}", exc_info=True)
            # Fallback to MP3 if OGG conversion fails, if it exists
            if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 0:
                logger.warning("[TTS] Falling back to MP3 format")
                return mp3_path
            raise e

    async def generate_tts_stream(self, text: str, lang: str):
        """
        Yields audio byte chunks asynchronously for real-time StreamingResponse.
        """
        voice = self.VOICES.get(lang, self.VOICES["en"])
        clean_text = sanitize_for_tts(text)
        
        # Fallback if empty after sanitization
        if not clean_text:
            clean_text = "I am sorry, I have nothing to say."
            
        communicate = edge_tts.Communicate(clean_text, voice)
        
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                yield chunk["data"]

tts_service = TTSService()
