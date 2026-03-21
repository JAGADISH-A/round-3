from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import vision_routes

app = FastAPI(title="BumbleBee Vision AI")

# Standardized CORS for BumbleBee AI Hive
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
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
    try:
        return {
            "status": "ok",
            "service": "vision",
            "port": 8002
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    import uvicorn
    print(f"\n\033[92m✅ Vision Service running on port 8002\033[0m")
    uvicorn.run(app, host="0.0.0.0", port=8002)
