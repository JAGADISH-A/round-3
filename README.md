# CareerSpark AI 🚀

CareerSpark AI is a comprehensive career intelligence platform designed to help users with interview coaching, resume analysis, and career guidance. It combines the power of Java Spring Boot, Python FastAPI with LLMs (Groq, Gemini), and a modern Next.js frontend.

## 🏗️ Architecture Overview

The project is structured as a multi-service architecture for scalability and modularity:

- **Frontend (Next.js)**: A responsive chat-based dashboard for user interactions.
- **Java Gateway (Spring Boot)**: Acts as the central entry point and proxy for AI services.
- **Intelligence Service (Python/FastAPI)**: Handles RAG, resume analysis, and chat logic using LangChain and Groq.
- **Vision Service (Python/FastAPI)**: Specialized in video/image analysis for interview coaching (Mediapipe, OpenCV).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript.
- **Microservices**: Python 3.10+, FastAPI, Java 17, Spring Boot 3.
- **AI/ML**: LangChain, Groq (Llama-3), Google Gemini, ChromaDB, SentenceTransformers.
- **Tools**: Maven, NPM, Pip.

---

## 📂 Project Structure

```plaintext
nm/
├── frontend/                  # Next.js Frontend
│   ├── app/                   # Next.js App Router
│   ├── components/            # UI Components
│   └── .env.example           # Frontend Env Template
├── backend/
│   ├── gateway/               # Java Spring Boot Proxy
│   │   └── src/main/java      # Java Source Code
│   └── ai-service/
│       ├── intelligence-service/ # Chat & RAG logic
│       │   ├── main.py
│       │   ├── requirements.txt
│       │   └── .env.example
│       └── vision-service/       # Video/Image analysis
│           ├── main.py
│           ├── requirements.txt
│           └── .env.example
├── .gitignore                 # Consolidated git ignore rules
└── README.md                  # Project Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Java 17** & **Maven**
- **Python 3.10+**
- **Node.js 18+**

### 2. Setup Services

#### Intelligence Service (RAG)
```bash
cd backend/ai-service/intelligence-service
python -m venv venv
# Windows: venv\Scripts\activate | Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Add your API keys!
python main.py
```

#### Vision Service (AI Feedback)
```bash
cd backend/ai-service/vision-service
python -m venv venv
# Windows: venv\Scripts\activate | Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # Add your API keys!
python main.py
```

#### Java Gateway
```bash
cd backend/gateway
mvn spring-boot:run
```

#### Frontend Dashboard
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## 🌐 Deployment Guidelines

### Frontend (Vercel)
- Connect your GitHub repo to Vercel.
- Set Root Directory to `frontend`.
- Add `NEXT_PUBLIC_API_URL` to Vercel Environment Variables (Point it to your deployed Gateway or Backend).

### Backend (Render / AWS)
- **Render**: Create "Web Service" for each component (`gateway` requires a Java environment, AI services require Python).
- **AWS**: Use **App Runner** for FastAPI services and **Elastic Beanstalk** (or ECS) for the Java Gateway.
- Ensure all Environment Variables from `.env.example` are added to the deployment platform's dashboard.

---

## 🛡️ Security Note
This repository uses `.gitignore` to prevent sensitive credentials (`.env`, `venv`, `node_modules`, `target`) from being pushed. Always use the provided `.env.example` templates for configuration.
