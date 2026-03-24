# BumbleBee AI - Intelligent Career Coach & Interview Simulator

BumbleBee AI is a professional, full-stack AI-driven platform designed to help candidates prepare for technical interviews and receive personalized career guidance. It features a real-time interview simulator, voice analysis, and automated feedback.

---

## 🏗️ System Architecture

The project is structured as a modular microservices-based system:

- **Frontend (`/frontend`)**: A modern Next.js dashboard for user interaction, interview simulation, and analytics.
- **Backend Gateway (`/backend`)**: A Java/Maven-based API gateway managing communication between the frontend and AI services.
- **Intelligence AI Service (`/ai-service/intelligence-service`)**: Python/FastAPI service handling LLM logic (LangChain), vector database (ChromaDB), and STT/TTS processing.
- **Vision AI Service (`/ai-service/vision-service`)**: Python/FastAPI service specializing in real-time facial behavioral analysis during mock interviews.

---

## 🚀 Key Features

- **Real-time Interview Simulation**: Practice technical and behavioral questions with an AI interviewer.
- **Advanced Voice Pipeline**: High-accuracy STT (Whisper) and natural TTS feedback.
- **Behavioral Vision Analysis**: Tracks eye contact and confidence during interviews.
- **Career Roadmap Generation**: Personalized roadmaps based on resume and career goals.
- **Automated Performance Scoring**: Get structured feedback and scores after every interaction.

---

## 🛠️ Setup & Local Development

### 1. Prerequisites
- **Node.js 18+** (Frontend)
- **Java 17+ & Maven** (Backend Gateway)
- **Python 3.11+** (AI Services)
- **FFmpeg** (Required for audio processing)

### 2. Environment Configuration
Copy the root `.env.example` to `.env` and fill in your API keys (Telegram, Groq, Google Gemini, and Firebase).

```bash
cp .env.example .env
```

### 3. Installation & Startup

#### Using the Hive Script (Windows)
Run the master startup script from the root directory:
```powershell
.\scripts\hive_start.ps1
```

#### Manual Startup
- **Frontend**: `cd frontend && npm install && npm run dev`
- **Backend**: `cd backend && mvn spring-boot:run`
- **Intelligence Service**: `cd ai-service/intelligence-service && pip install -r requirements.txt && python main.py`
- **Vision Service**: `cd ai-service/vision-service && pip install -r requirements.txt && python main.py`

---

## 🔐 Security & Deployment

- **Secret Management**: All API keys and sensitive tokens are managed via `.env` files and are strictly excluded from version control.
- **Production Ready**: Follows clean code principles and modular separation for easy scaling.

---

## 📄 License
This project is for internal career readiness training and development.
