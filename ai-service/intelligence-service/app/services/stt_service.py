"""
STT Service — Speech-to-Text pipeline using faster-whisper + pydub.

FFmpeg is configured at module level before any audio operations, with
validation, fallback to system PATH, and startup logging.
"""

# ── Standard library ─────────────────────────────────────────────────────────
import os
import sys
import tempfile
import uuid
import logging
import asyncio

# ── Logging setup (before anything else so FFmpeg init gets logged) ───────────
logger = logging.getLogger(__name__)

# ═════════════════════════════════════════════════════════════════════════════
# SECTION 1: FFmpeg — Module-Level Configuration (Windows)
# Must happen before pydub is imported/used so the converter path is resolved.
# ═════════════════════════════════════════════════════════════════════════════

FFMPEG_PATH  = r"C:\ffmpeg\bin\ffmpeg.exe"
FFPROBE_PATH = r"C:\ffmpeg\bin\ffprobe.exe"
FFMPEG_BIN   = r"C:\ffmpeg\bin"

def _configure_ffmpeg() -> bool:
    """
    Validate and configure FFmpeg for pydub.
    Returns True if the absolute-path method succeeds, False on fallback.
    Raises FileNotFoundError if neither method is viable.
    """
    from pydub import AudioSegment

    # Primary: absolute path (preferred — deterministic on Windows)
    if os.path.isfile(FFMPEG_PATH) and os.path.isfile(FFPROBE_PATH):
        # Inject bin dir into PATH so subprocess calls can resolve ffprobe too
        if FFMPEG_BIN not in os.environ.get("PATH", ""):
            os.environ["PATH"] = FFMPEG_BIN + os.pathsep + os.environ.get("PATH", "")

        AudioSegment.converter = FFMPEG_PATH
        AudioSegment.ffprobe   = FFPROBE_PATH
        logger.info("[STT INIT] FFmpeg configured via absolute path: %s", FFMPEG_PATH)
        return True

    # Fallback: rely on system PATH
    logger.warning(
        "[STT INIT] FFmpeg not found at %s — falling back to system PATH.", FFMPEG_PATH
    )
    import shutil
    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        AudioSegment.converter = "ffmpeg"
        AudioSegment.ffprobe   = "ffprobe"
        logger.info("[STT INIT] FFmpeg configured via system PATH.")
        return False

    raise FileNotFoundError(
        f"FFmpeg not found at '{FFMPEG_PATH}' and not available on system PATH. "
        "Install FFmpeg from https://ffmpeg.org/download.html or update FFMPEG_PATH."
    )

# Prevent OpenMP duplicate-lib conflicts (must be set before any ML imports)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Run configuration at import time — fail fast with a clear error
_configure_ffmpeg()

# ── Now safe to import pydub at module level ──────────────────────────────────
from pydub import AudioSegment

# ── Whisper model ─────────────────────────────────────────────────────────────
from faster_whisper import WhisperModel


# ═════════════════════════════════════════════════════════════════════════════
# SECTION 2: STT Service (singleton)
# ═════════════════════════════════════════════════════════════════════════════

class STTService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = None
        return cls._instance

    # No FFmpeg config here — handled at module level above.

    def _get_model(self) -> WhisperModel:
        """Lazy-load Whisper model (CPU, int8) on first use."""
        if self.model is None:
            logger.info("[STT] Loading Whisper model (tiny / CPU / int8)...")
            self.model = WhisperModel("tiny", device="cpu", compute_type="int8")
        return self.model

    async def warmup(self) -> None:
        """Pre-load the model to eliminate first-request latency."""
        await asyncio.to_thread(self._get_model)

    async def transcribe(self, audio_bytes: bytes, filename: str) -> str:
        """Async wrapper — offloads blocking transcription to a thread pool."""
        return await asyncio.to_thread(self._transcribe_sync, audio_bytes, filename)

    def _transcribe_sync(self, audio_bytes: bytes, filename: str) -> str:
        """
        Transcribes raw audio bytes.
        Accepts any format pydub supports (ogg, mp3, wav, …) — converts to 16 kHz WAV.
        """
        temp_dir  = os.path.join(tempfile.gettempdir(), "bumblebee_stt")
        os.makedirs(temp_dir, exist_ok=True)

        ext        = os.path.splitext(filename)[1].lower() or ".ogg"
        input_path = os.path.join(temp_dir, f"{uuid.uuid4()}{ext}")
        wav_path   = os.path.join(temp_dir, f"{uuid.uuid4()}.wav")

        try:
            # 1. Persist raw bytes
            logger.info("[STT] 1. Saving audio payload → %s", input_path)
            if not audio_bytes:
                logger.error("[STT] Received EMPTY audio bytes — aborting.")
                return ""
            with open(input_path, "wb") as f:
                f.write(audio_bytes)

            file_size = os.path.getsize(input_path)
            logger.info("[STT] 2. Payload: %d bytes | converter: %s", file_size, AudioSegment.converter)

            # 2. Convert to 16 kHz mono WAV via pydub + FFmpeg
            try:
                audio = AudioSegment.from_file(input_path)
                logger.info("[STT] 3. Audio loaded — duration: %.2fs", len(audio) / 1000)
            except Exception as pydub_err:
                logger.error("[STT] pydub/FFmpeg failed to load audio: %s", pydub_err)
                raise

            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(wav_path, format="wav")

            # 3. Transcribe
            logger.info("[STT] 4. Running Whisper transcription...")
            model = self._get_model()
            segments, info = model.transcribe(wav_path, beam_size=5)

            transcription = "".join(seg.text for seg in segments).strip()
            logger.info("[STT] 5. Done (%s): '%s'", info.language, transcription)
            return transcription

        except Exception as exc:
            logger.error("[STT] Transcription error: %s", exc, exc_info=True)
            raise

        finally:
            # 4. Clean up temp files
            logger.info("[STT] 6. Cleaning up temp files.")
            for path in (input_path, wav_path):
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except Exception as clean_err:
                        logger.warning("[STT] Cleanup failed for %s: %s", path, clean_err)


# Module-level singleton
stt_service = STTService()
