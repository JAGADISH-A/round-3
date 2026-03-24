from pydub import AudioSegment
import os
import sys

# --- PRE-IMPORT ENVIRONMENT CONFIG ---
# We MUST add FFmpeg to PATH before pydub is imported, 
# otherwise pydub.utils will trigger a RuntimeWarning immediately.
FFMPEG_BIN = r"C:\ffmpeg\bin"
if FFMPEG_BIN not in os.environ["PATH"]:
    os.environ["PATH"] = FFMPEG_BIN + os.pathsep + os.environ["PATH"]

# Set converter immediately
AudioSegment.converter = r"C:\ffmpeg\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\ffmpeg\bin\ffprobe.exe"
import tempfile
import uuid
import logging
import asyncio
from faster_whisper import WhisperModel
import imageio_ffmpeg as ffmpeg

# --- FFmpeg Configuration (Mandatory for Windows STT Pipeline) ---
FFMPEG_PATH = "C:\\ffmpeg\\bin\\ffmpeg.exe"
FFPROBE_PATH = "C:\\ffmpeg\\bin\\ffprobe.exe"

if not os.path.exists(FFMPEG_PATH):
    raise RuntimeError(f"FFmpeg not found at {FFMPEG_PATH}")

if not os.path.exists(FFPROBE_PATH):
    raise RuntimeError(f"FFprobe not found at {FFPROBE_PATH}")

AudioSegment.converter = FFMPEG_PATH
AudioSegment.ffprobe   = FFPROBE_PATH
# -----------------------------------------------------------------

# Prevent OpenMP runtime conflict errors
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class STTService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(STTService, cls).__new__(cls)
            cls._instance.model = None
        return cls._instance

    def _get_model(self):
        if self.model is None:
            # CPU Optimized inference with int8 computes natively faster
            logger = logging.getLogger(__name__)
            logger.info("[STT] Loading Whisper Model (CPU)...")
            from faster_whisper import WhisperModel
            self.model = WhisperModel("tiny", device="cpu", compute_type="int8")
        return self.model

    async def warmup(self):
        """Pre-loads the model to avoid latency on the first request."""
        import asyncio
        await asyncio.to_thread(self._get_model)

    import asyncio
    
    async def transcribe(self, audio_bytes: bytes, filename: str) -> str:
        """Async wrapper for the blocking transcription process to protect the event loop."""
        import asyncio
        return await asyncio.to_thread(self._transcribe_sync, audio_bytes, filename)
        
    def _transcribe_sync(self, audio_bytes: bytes, filename: str) -> str:
        """
        Transcribes audio bytes utilizing faster-whisper.
        Automatically converts .ogg (or other formats) to standard .wav.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        temp_dir = os.path.join(tempfile.gettempdir(), "bumblebee_stt")
        os.makedirs(temp_dir, exist_ok=True)

        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = ".ogg"

        input_path = os.path.join(temp_dir, f"{uuid.uuid4()}{ext}")
        wav_path = os.path.join(temp_dir, f"{uuid.uuid4()}.wav")

        try:
            logger.info(f"[STT] 1. Saving voice payload to temp file: {input_path}")
            # Ensure the bytes are valid
            if not audio_bytes:
                logger.error("[STT] Received EMPTY audio bytes!")
                return ""
            
            with open(input_path, "wb") as f:
                f.write(audio_bytes)

            file_size = os.path.getsize(input_path)
            logger.info(f"[STT] 2. Payload size: {file_size} bytes. Using converter: {AudioSegment.converter}")
            
            # 2. Convert to 16kHz WAV using pydub
            try:
                audio = AudioSegment.from_file(input_path)
                logger.info(f"[STT] 3. Audio loaded. Duration: {len(audio)/1000:.2f}s")
            except Exception as pydub_err:
                logger.error(f"[STT] FFmpeg/Pydub FAILED to load audio: {pydub_err}")
                raise pydub_err

            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(wav_path, format="wav")

            logger.info("[STT] 3. Loading Whisper Model and performing transcription step.")
            # 3. Transcribe
            model = self._get_model()
            segments, info = model.transcribe(wav_path, beam_size=5)

            # 4. Construct transcription text
            transcription = "".join([segment.text for segment in segments]).strip()
            
            logger.info(f"[STT] 4. Transcription successful ({info.language}): '{transcription}'")
            return transcription

        except Exception as e:
            logger.error(f"[STT] Error during processing: {e}", exc_info=True)
            raise e

        finally:
            # Clean up temp files with retry/safety
            logger.info("[STT] 5. Cleaning up temp files.")
            for p in [input_path, wav_path]:
                if os.path.exists(p):
                    try:
                        # Close any potential handles (though pydub/whisper should have closed them)
                        os.remove(p)
                    except Exception as clean_err:
                        logger.warning(f"[STT] Cleanup failed for {p}: {clean_err}")

stt_service = STTService()
