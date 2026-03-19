"""Career Readiness AI Service — FastAPI entry point."""

import os
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

from app.api.models import router as models_router
from app.api.personas import router as personas_router
from app.api.chat import router as mcp_chat_router

app = FastAPI(title="CareerSpark AI", version="1.0.0")

class PrepRequest(BaseModel):
    role: str

class RoadmapRequest(BaseModel):
    role: str
    resume_analysis: dict | None = None

class ReportRequest(BaseModel):
    data: dict

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


# Register MCP routes
app.include_router(models_router, prefix="/api", tags=["MCP"])
app.include_router(personas_router, prefix="/api", tags=["MCP"])
app.include_router(mcp_chat_router, prefix="/api", tags=["MCP"])

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


@app.get("/health")
def health():
    return {"status": "AI Intelligence Service Running"}


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
        result = get_chat_response(messages_dict)
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
        return {"feedback": feedback}
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
        result = generate_personalized_roadmap(request.role, user_skills)
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
    service_type = "Vision AI Service" if port == 8002 else "RAG AI Service"
    print(f"\n{service_type} started on port {port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
