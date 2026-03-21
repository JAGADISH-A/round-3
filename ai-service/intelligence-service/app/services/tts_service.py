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
        Generates TTS using edge-tts and returns the file path.
        This is an async function.
        """
        voice = self.VOICES.get(lang, self.VOICES["en"])
        
        # Ensure temporary directory exists
        temp_dir = os.path.join(tempfile.gettempdir(), "bumblebee_tts")
        os.makedirs(temp_dir, exist_ok=True)
        
        file_path = os.path.join(temp_dir, f"{uuid.uuid4()}.mp3")
        
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(file_path)
        
        return file_path

tts_service = TTSService()
