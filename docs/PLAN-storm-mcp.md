# Project Plan: Storm MCP Integration

This plan implements an Agile, sprint-based integration of **Storm MCP** into the BumbleBee AI ecosystem, prioritizing resource efficiency and singleton connection patterns.

## 📋 Overview
- **Project Type**: BACKEND (FastAPI) + FRONTEND (Next.js)
- **Objective**: Add real-time search capabilities via Storm MCP while maintaining a singleton connection for performance and hybrid routing to minimize costs.

## ✅ Success Criteria
- [ ] Singleton MCP client connects once on FastAPI startup.
- [ ] `Career Copilot` responds natively for simple queries (greetings, general career advice).
- [ ] `Career Copilot` triggers Brave Search via MCP only for real-time data needs.
- [ ] No "re-reconnection" overhead on individual requests.

## 🛠️ Tech Stack
- **Backend**: FastAPI, `mcp` Python SDK, `httpx`.
- **Infrastructure**: Storm MCP Gateway (SSE Transport).
- **LLM**: Local/API models (Llama 3.3/Groq) + MCP Tool Augmentation.

## 📂 File Structure Changes
```plaintext
ai-service/intelligence-service/
├── app/
│   ├── services/
│   │   └── mcp_service.py          # [NEW] Singleton Client & Tool Logic
│   └── main.py                     # [MODIFY] Startup/Shutdown Events
└── docs/
    └── PLAN-storm-mcp.md           # [NEW] This Plan
```

## 🏃 Sprint Breakdown

### Sprint 1: Foundation (Singleton & Lifecycle)
**Goal**: Establish the persistent connection.
- **Task 1.1**: Create `app/services/mcp_service.py`.
    - Implement a thread-safe singleton `StormMCPClient`.
    - Handle SSE connection logic and session initialization.
- **Task 1.2**: Update `main.py` with the modern `lifespan` context manager or `@app.on_event("startup")` and `"shutdown"`.
    - Initialize the global MCP client instance.

### Sprint 2: Hybrid Routing & Chat Integration
**Goal**: Trigger tools only when necessary.
- **Task 2.1**: Update `intent_detector.py` or `chat.py`.
    - Add logic to detect "Real-time" intent (e.g., job searches, current news).
- **Task 2.2**: Integrate `execute_tool` into the `chat_mcp` endpoint.
    - If real-time data is needed → Call MCP tool → Augment Prompt.
    - Otherwise → Use existing LLM logic.

### Sprint 3: Verification & UX
**Goal**: Ensure reliability and feedback.
- **Task 3.1**: Implement verification scripts for latency and connection health.
- **Task 3.2**: Add "Source: Brave Search" metadata to the frontend chat responses.

## 📈 Agent Assignments
| Phase | Agent | Skill |
|---|---|---|
| Foundation | `backend-specialist` | `python-patterns`, `fastapi` |
| Security | `security-auditor` | `vulnerability-scanner` |
| Verification | `test-engineer` | `testing-patterns` |

## ✅ Phase X: Final Verification
- [ ] Singleton connection verified (check logs for single "Connected" message).
- [ ] Simple greeting test: "Hello" -> No MCP call.
- [ ] Real-time query test: "Latest React junior roles in Chennai" -> MCP tool call visible in logs.
- [ ] `security_scan.py` run on `.env` modifications.
