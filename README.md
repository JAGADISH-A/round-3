# 🐝 BumbleBee AI | Your Intelligent Career Ecosystem

BumbleBee AI is a next-generation career readiness platform designed to empower students and professionals through advanced AI-driven tools. From resume optimization to real-time interview simulations, BumbleBee AI provides a cohesive, premium experience for the modern job market.

![BumbleBee Logo](logo.png)

## 🚀 Key Features

- **💬 The Hive (AI Chat)**: A sophisticated career coach capable of roadmapping, skill gap analysis, and personalized advice.
- **🎙️ Voice Pro Analyzer**: Real-time interview simulation with instant vocal analytics (WPM, fillers, confidence) and AI feedback.
- **📄 Resume Intelligence**: Deep-scan resume analysis with ATS scoring, impact evaluation, and target-role tuning.
- **🛡️ Secure Auth**: Robust authentication powered by Firebase.
- **☸️ Multi-Model Intelligence**: Orchestrated power using Groq (Llama 3), Google Gemini 1.5 Pro, and custom vision models.

## 🏗️ Architecture

BumbleBee AI utilizes a high-performance hybrid architecture:
- **Frontend**: Next.js 14 (App Router) with Tailwind CSS.
- **Intelligence Service**: Python FastAPI / LangChain (Port 8001).
- **Vision AI Service**: Python FastAPI / Custom Face & Eye Tracking (Port 8002).
- **Gateway**: Java Spring Boot (Optional orchestration).

## 🛠️ Tech Stack

- **Frameworks**: Next.js, FastAPI, Spring Boot
- **AI/ML**: LangChain, Groq, Gemini API, MediaPipe
- **Security**: Firebase Auth
- **UI/UX**: Tailwind CSS, Framer Motion, Lucide Icons

## ⚙️ Local Setup

### 1. Prerequisites
- Node.js 20+
- Python 3.10+
- Java 17+ (for Gateway)

### 2. Environment Configuration
Copy the `.env.example` files to `.env` in their respective directories and fill in your API keys:
- `frontend/.env.local`
- `backend/ai-service/intelligence-service/.env`
- `backend/ai-service/vision-service/.env`

### 3. Installation & Run

#### **Frontend**
```bash
cd frontend
npm install
npm run dev
```

#### **Intelligence Service**
```bash
cd backend/ai-service/intelligence-service
pip install -r requirements.txt
python main.py
```

#### **Vision Service**
```bash
cd backend/ai-service/vision-service
pip install -r requirements.txt
python main.py
```

## 📜 License
This project is for educational and career-readiness purposes.

---
*Built with ❤️ by the BumbleBee AI Team.*
