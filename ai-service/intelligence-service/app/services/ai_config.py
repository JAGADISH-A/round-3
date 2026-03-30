"""AI Configuration — Shared LLM instances and configuration to avoid circular imports."""

import os
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = "llama-3.3-70b-versatile"

llm = ChatGroq(
    temperature=0.4,
    model_name=MODEL_NAME,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# Fetch MCP tools to bind them to the LLM (for native tool calling support)
try:
    from app.services.mcp_client import get_mcp_tools
    mcp_tools = get_mcp_tools()
    llm_with_tools = llm.bind_tools(mcp_tools) if mcp_tools else llm
except Exception as e:
    print(f"[AI Config] Failed to bind MCP tools: {e}")
    llm_with_tools = llm

voice_llm = None
if os.getenv("GOOGLE_API_KEY"):
    try:
        voice_llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro-latest",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.2
        )
    except Exception:
        voice_llm = None
