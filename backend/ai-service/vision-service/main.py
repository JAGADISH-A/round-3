from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import vision_routes

app = FastAPI(title="CareerSpark Vision AI Service")

# 1. Configure CORS
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Register Router
app.include_router(vision_routes.router, prefix="/vision", tags=["vision"])

@app.get("/health")
def health():
    return {"status": "Vision AI Service Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
