from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.stt_service import stt_service

router = APIRouter()

@router.post("/stt")
async def process_stt(audio: UploadFile = File(...)):
    """
    Accepts an audio file (like .ogg) and returns the transcribed text.
    Uses CPU-optimized faster-whisper.
    """
    try:
        content = await audio.read()
        transcription = await stt_service.transcribe(content, audio.filename)
        return {"text": transcription}
    except Exception as e:
        print(f"STT Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
