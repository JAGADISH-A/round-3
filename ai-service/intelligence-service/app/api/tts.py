from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from app.services.tts_service import tts_service
import os

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    lang: str = "en" # 'en' or 'ta'

@router.post("/tts")
async def generate_voice(request: TTSRequest, background_tasks: BackgroundTasks):
    try:
        # Map lang to Edge-TTS codes if necessary
        lang_code = "ta" if request.lang == "ta" else "en"
        
        # generate_tts is now async
        file_path = await tts_service.generate_tts(request.text, lang_code)
        
        # Clean up the file after sending
        def cleanup():
            if os.path.exists(file_path):
                os.remove(file_path)
                
        background_tasks.add_task(cleanup)
        
        return FileResponse(file_path, media_type="audio/mpeg")
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tts/stream")
async def generate_voice_stream(text: str, lang: str = "en"):
    """
    Real-time streaming endpoint for TTS. 
    Yields MPEG audio bytes as they are synthesized.
    """
    try:
        lang_code = "ta" if lang == "ta" else "en"
        return StreamingResponse(
            tts_service.generate_tts_stream(text, lang_code), 
            media_type="audio/mpeg"
        )
    except Exception as e:
        print(f"TTS Stream Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
