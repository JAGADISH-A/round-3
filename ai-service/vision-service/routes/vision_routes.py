from fastapi import APIRouter, Body
from pydantic import BaseModel
from utils.image_decoder import decode_base64_image
from services.face_analysis.facemesh_detector import detector

router = APIRouter()

class ImageRequest(BaseModel):
    image_base64: str

@router.post("/analyze")
async def analyze_vision(request: ImageRequest):
    """
    Endpoint to receive a camera frame and return advanced MediaPipe facial analysis.
    """
    # 1. Decode base64 image
    frame = decode_base64_image(request.image_base64)
    
    # 2. Run FaceMesh analysis
    results = detector.analyze(frame)
    
    # 3. Return extended metrics
    return results
