import os
import tempfile
import uuid
from faster_whisper import WhisperModel
import imageio_ffmpeg as ffmpeg
from pydub import AudioSegment

class STTService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(STTService, cls).__new__(cls)
            cls._instance.model = None
            # Set ffmpeg path explicitly for pydub to prevent path resolution issues
            AudioSegment.converter = ffmpeg.get_ffmpeg_exe()
        return cls._instance

    def _get_model(self):
        if self.model is None:
            # CPU Optimized inference with int8 computes natively faster
            print("[STT] Loading Whisper Model (CPU)...")
            self.model = WhisperModel("tiny", device="cpu", compute_type="int8")
        return self.model

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
            # 1. Save raw incoming bytes to temp file
            with open(input_path, "wb") as f:
                f.write(audio_bytes)

            logger.info("[STT] 2. Processing via pydub to standard 16kHz WAV format.")
            # 2. Convert to 16kHz WAV using pydub
            audio = AudioSegment.from_file(input_path)
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
            # Clean up temp files
            logger.info("[STT] 5. Cleaning up temp files.")
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(wav_path):
                os.remove(wav_path)

stt_service = STTService()
