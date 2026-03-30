"""MCP Client Bridge using direct HTTP POST for stateless Next.js environments."""

import requests
from typing import List, Union, Dict, Optional
from pydantic import BaseModel, Field
from langchain.tools import Tool, StructuredTool

MCP_URL = "http://localhost:3002/api/mcp_messages"

# ─── Pydantic Models for Schema Injection ─────────────────────────────────────

class SearchInput(BaseModel):
    """Input for search tools."""
    query: str = Field(..., description="The search query formulation.")
    search_service: str = Field("google", description="Search engine to use (google, bing, etc.).")

# ─── Tool Helpers ─────────────────────────────────────────────────────────────

def call_tool(name: str, arguments: dict):
    print(f"[MCP Client] Calling tool: {name} with args: {arguments}")
    try:
        # Standardize arguments: Ensure it's a dict
        if isinstance(arguments, str):
            arguments = {"query": arguments}
        
        # Flatten 'config' or other wrappers if they slip through
        if "config" in arguments and isinstance(arguments["config"], dict):
            config = arguments.pop("config")
            for key, value in config.items():
                arguments[key] = value

        # Ensure search_service default
        if "search_service" not in arguments:
            arguments["search_service"] = "google"

        response = requests.post(MCP_URL, json={
            "name": name,
            "arguments": arguments
        }, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # Parse the standard MCP response format
        if "content" in data and isinstance(data["content"], list):
            return "\n".join([str(c.get("text", "")) for c in data["content"]])
        return str(data)
    except Exception as e:
        print(f"[MCP Client] Error calling {name}: {e}")
        return f"Error executing tool: {e}"

# ─── Tool Factory ─────────────────────────────────────────────────────────────

def get_mcp_tools() -> List[Union[Tool, StructuredTool]]:
    """Retrieve LangChain-wrapped tools with explicit Pydantic schemas."""
    
    # We use StructuredTool to ensure that the LLM (Gemini/Groq) receives 
    # a clear JSON schema during the 'bind_tools' handshake.
    
    web_search_tool = StructuredTool.from_function(
        name="web_search",
        func=lambda query, search_service="google": call_tool("web_search", {"query": query, "search_service": search_service}),
        description="Perform a web search using Search1API. Excellent for finding real-time career data, news, and technical solutions. Use it whenever current info is needed.",
        args_schema=SearchInput
    )
    
    news_search_tool = StructuredTool.from_function(
        name="news_search",
        func=lambda query, search_service="google": call_tool("news_search", {"query": query, "search_service": search_service}),
        description="Search for the latest news articles using Search1API. Use it for current events, trends, and recent updates.",
        args_schema=SearchInput
    )
    
    return [web_search_tool, news_search_tool]
