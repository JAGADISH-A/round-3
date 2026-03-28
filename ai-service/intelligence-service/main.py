import os
import sys

# --- BumbleBee AI - Global FFmpeg Environment Injection ---
FFMPEG_BIN = r"C:\ffmpeg\bin"
if FFMPEG_BIN not in os.environ["PATH"]:
    os.environ["PATH"] = FFMPEG_BIN + os.pathsep + os.environ["PATH"]
# ----------------------------------------------------------

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.langchain_service import get_chat_response, analyze_voice_transcript
from app.services.vector_db_service import get_collection as _get_collection, get_embedding_model as _get_embedding_model
from app.services.resume_service import parse_resume
from app.services.intelligence_service import calculate_career_readiness
from app.services.career_prep_service import get_career_preparation
from app.services.roadmap_service import get_career_roadmap
from app.services.report_service import generate_developer_report
from fastapi.staticfiles import StaticFiles
import tempfile

from app.api.models import router as models_router
from app.api.personas import router as personas_router
from app.api.chat import router as mcp_chat_router
from app.api.tts import router as tts_router
from app.api.stt import router as stt_router
from app.api.resume import router as resume_router
from app.services.tts_service import sanitize_for_tts

app = FastAPI(title="BumbleBee AI Intelligence", version="1.0.0")

# Standardized CORS for BumbleBee AI Hive
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    try:
        return {
            "status": "ok",
            "service": "intelligence",
            "port": 8001,
            "version": "1.0.0"
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    lang: str = "en"


# Register MCP routes
app.include_router(models_router, prefix="/api", tags=["MCP"])
app.include_router(personas_router, prefix="/api", tags=["MCP"])
app.include_router(mcp_chat_router, prefix="/api", tags=["MCP"])
app.include_router(tts_router, prefix="/api", tags=["TTS"])
app.include_router(stt_router, prefix="/api", tags=["STT"])
app.include_router(resume_router, prefix="/api", tags=["Resume"])

# Static route for TTS audio files
temp_tts_dir = os.path.join(tempfile.gettempdir(), "bumblebee_tts")
os.makedirs(temp_tts_dir, exist_ok=True)
app.mount("/api/audio", StaticFiles(directory=temp_tts_dir), name="audio")

class VoiceRequest(BaseModel):
    transcript: str


class ResumeRoleRequest(BaseModel):
    full_text: str
    target_role: str


class IntelligenceRequest(BaseModel):
    resume_analysis: dict
    voice_history: list = []
    voice_metrics: dict | None = None
    target_role: str | None = None


class PrepRequest(BaseModel):
    role: str


class RoadmapRequest(BaseModel):
    role: str
    resume_analysis: dict | None = None
    lang: str = "en"


class ReportRequest(BaseModel):
    data: dict


@app.get("/collections")
def collections():
    try:
        col = _get_collection()
        model = _get_embedding_model()
        return {
            "name": col.name,
            "count": col.count(),
            "embedding_dimension": model.get_sentence_embedding_dimension()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Handle resume upload and return analysis."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        analysis = parse_resume(content)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/resume/analyze-role")
async def analyze_resume_role(request: ResumeRoleRequest):
    """Re-analyze existing resume text against a specific target role."""
    try:
        analysis = parse_resume(request.full_text.encode("utf-8"), target_role=request.target_role)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty.")
    
    try:
        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        result = get_chat_response(messages_dict, lang=request.lang)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/voice/analyze")
def voice_analyze(request: VoiceRequest):
    try:
        analysis = analyze_voice_transcript(request.transcript)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/intelligence/aggregate")
def aggregate_intelligence(request: IntelligenceRequest):
    try:
        result = calculate_career_readiness(
            request.resume_analysis,
            request.voice_history,
            voice_metrics=request.voice_metrics,
            target_role=request.target_role,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/career-prep")
def career_prep(request: PrepRequest):
    try:
        result = get_career_preparation(request.role)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VisionFeedbackRequest(BaseModel):
    eye_contact: int
    engagement: int
    head_pose: str
    confidence_score: int

@app.post("/ai/vision-feedback")
def vision_feedback(request: VisionFeedbackRequest):
    try:
        from app.services.langchain_service import get_vision_coaching_feedback
        feedback = get_vision_coaching_feedback(request.dict())
        return {
            "feedback": feedback,
            "tts_text": sanitize_for_tts(feedback)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GenerateRoadmapRequest(BaseModel):
    goal: str
    skills: list[str] = []

@app.post("/career-roadmap")
@app.post("/api/generate-roadmap")
def career_roadmap(request: RoadmapRequest):
    """Legacy and new combined endpoint for roadmaps."""
    try:
        # Extract skills if present in resume_analysis
        user_skills = request.resume_analysis.get("skills", []) if request.resume_analysis else []
        from app.services.roadmap_generator import generate_personalized_roadmap
        result = generate_personalized_roadmap(request.role, user_skills, lang=request.lang)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/developer-report")
def developer_report(request: ReportRequest):
    try:
        result = generate_developer_report(request.data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    print(f"\n\033[92m✅ Intelligence Service running on port {port}\033[0m")
    uvicorn.run(app, host="0.0.0.0", port=port)
