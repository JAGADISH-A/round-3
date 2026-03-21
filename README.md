# 🐝 BumbleBee AI | Your Intelligent Career Ecosystem

BumbleBee AI is a next-generation career readiness platform designed to empower students and professionals through advanced AI-driven tools. From resume optimization to real-time interview simulations, BumbleBee AI provides a cohesive, premium experience for the modern job market.

## 📁 Repository Structure

```tree
.
├── ai-service/          # Python FastAPI Services (Intelligence & Vision)
├── backend/             # Java Spring Boot Gateway
├── frontend/            # Next.js 14 Web Application
├── scripts/             # Utility & Management Scripts
└── README.md            # Project Documentation
```

## 🚀 Key Features

- **💬 The Hive (AI Chat)**: A sophisticated career coach for skill gap analysis and personalized mentoring.
- **🎙️ Voice Pro Analyzer**: Real-time interview simulation with vocal analytics (WPM, fillers, confidence).
- **📄 Resume Intelligence**: ATS scoring, impact evaluation, and target-role tuning.
- **🛡️ Secure Auth**: Robust authentication powered by Firebase.
- **☸️ Multi-Model Intelligence**: Orchestrated power using Groq (Llama 3), Google Gemini 1.5 Pro, and custom vision models.

## 🏗️ Technical Architecture

- **Frontend**: Next.js 14 (App Router) / Tailwind CSS / Framer Motion.
- **Intelligence Service**: Python FastAPI / LangChain / ChromaDB.
- **Vision AI Service**: Python FastAPI / MediaPipe / OpenCV.
- **Gateway**: Java Spring Boot / Spring Cloud Gateway.

## ⚙️ Local Setup

### 1. Prerequisites
- Node.js 20+
- Python 3.10+
- Java 17+

### 2. Environment Configuration
Copy the provided `.env.example` to `.env` in the root and service directories:
```bash
cp .env.example .env
# Also copy to specific service folders if required by the service local setup
```

### 3. Installation & Run

#### **AI Services**
```bash
cd ai-service/intelligence-service
pip install -r requirements.txt
python main.py
```

#### **Frontend**
```bash
cd frontend
npm install
npm run dev
```

#### **Backend Gateway**
```bash
cd backend
./mvnw spring-boot:run
```

## 📜 License
This project is for educational and career-readiness purposes.

---
*Built with ❤️ by the BumbleBee AI Team.*
