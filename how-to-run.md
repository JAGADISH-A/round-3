# CareerSpark AI — How to Run Guide

This project consists of four main components that work together to provide a career intelligence experience. Follow the steps below to set up and run the entire system.

## 1. Prerequisites
Ensure you have the following installed:
- **Java 17** (Run `java -version`)
- **Python 3.10+** (Run `python --version`)
- **Node.js 18+** (Run `node -v`)
- **Maven** (Run `mvn -version`)

---

## 2. Backend: Java Gateway
The Gateway acts as a proxy for the AI services, providing a single entry point for the frontend.

- **Directory**: `backend/gateway`
- **Port**: 8080
- **Commands**:
  ```bash
  cd backend/gateway
  mvn spring-boot:run
  ```

---

## 3. Backend: Intelligence Service (RAG)
This service handles chat, RAG (Retrieval-Augmented Generation), and resume analysis.

- **Directory**: `backend/ai-service/intelligence-service`
- **Port**: 8001
- **Setup**:
  1. Create a virtual environment:
     ```bash
     python -m venv venv
     source venv/bin/activate  # On Windows: venv\Scripts\activate
     ```
  2. Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
  3. Ensure `.env` is configured with:
     - `GROQ_API_KEY`
     - `GOOGLE_API_KEY`
     - `TELEGRAM_BOT_TOKEN`
- **Command**:
  ```bash
  python main.py
  ```

---

## 4. Backend: Vision AI Service
This service handles video/image analysis for interview coaching.

- **Directory**: `backend/ai-service/vision-service`
- **Port**: 8002
- **Setup**:
  1. (Optional) Create a virtual environment or use the same as above.
  2. Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
- **Command**:
  ```bash
  python main.py
  ```

---

## 5. Frontend: Next.js Dashboard
The user interface for CareerSpark AI.

- **Directory**: `frontend`
- **Port**: 3000
- **Setup**:
  1. Install dependencies:
     ```bash
     npm install
     ```
  2. Configure `.env.local`:
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:8001
     ```
     *(Note: You can also point this to the Gateway at `http://localhost:8080/api/ai` if proxying is preferred)*
- **Command**:
  ```bash
  npm run dev
  ```

---

## Verification
Once all services are running, you can verify they are healthy:
- **Gateway Health**: `GET http://localhost:8080/health` (Proxy check)
- **Intelligence Health**: `GET http://localhost:8001/health`
- **Vision Health**: `GET http://localhost:8002/health`
- **Frontend**: Open `http://localhost:3000` in your browser.
