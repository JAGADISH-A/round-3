"""Groq LLM Provider — Specialized logic for Groq/Llama models with Agentic Search."""

import json
import re
from typing import List, Dict, Any
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage
from app.services.ai_config import llm, llm_with_tools
from app.services.mcp_client import get_mcp_tools

def _extract_json_tool_call(content: str) -> Dict[str, Any] | None:
    """Manual parser for strict/flat JSON tool calls in the response content."""
    try:
        # Look for a JSON block
        if '{' in content and '}' in content:
            # Clean possible markdown block markers
            cleaned = re.sub(r"```(?:json)?\s*", "", content.strip())
            cleaned = re.sub(r"\s*```$", "", cleaned)
            # Find the first { and last } to handle cases with surrounding text
            start = cleaned.find('{')
            end = cleaned.rfind('}') + 1
            if start != -1 and end != 0:
                data = json.loads(cleaned[start:end])
                
                # Case 1: Manual Envelope (name/arguments) - already handled but kept for compat
                if "name" in data and "arguments" in data:
                    return data
                
                # Case 2: Flat JSON (query/search_service) - New Strict Format
                if "query" in data:
                    # Infer tool name from query context if it's a flat format
                    query_lower = data["query"].lower()
                    tool_name = "news_search" if "news" in query_lower or "latest" in query_lower else "web_search"
                    return {"name": tool_name, "arguments": data}
                    
    except Exception:
        pass
    return None

def call_groq(prompt: str, history: List[Dict[str, str]] = None, system_prompt: str = None) -> str:
    """Invoke Llama 3 via Groq with a disciplined 2-iteration tool-calling loop."""
    messages = []
    
    if system_prompt:
        messages.append(("system", system_prompt))
        
    if history:
        for msg in history:
            messages.append((msg["role"], msg["content"]))
    
    messages.append(("human", prompt))
    
    # Load tools mapper once
    mcp_tools = get_mcp_tools()
    tool_map = {t.name: t for t in mcp_tools}
    
    # 🔁 SEARCH LOOP (Max 2 tool call iterations)
    max_iterations = 2
    current_iteration = 0
    
    while current_iteration < max_iterations:
        # Initial or iterative LLM call
        response = llm_with_tools.invoke(messages)
        content = response.content.strip()
        
        # Check for Native Tool Calls OR Manual JSON Tool Calls
        native_calls = getattr(response, "tool_calls", [])
        manual_call = _extract_json_tool_call(content) if not native_calls else None
        
        if not native_calls and not manual_call:
            # No tool call detected, return final answer
            return content

        current_iteration += 1
        print(f"[GroqProvider] Iteration {current_iteration}: Tool call detected.")
        
        # Append AI message to context
        messages.append(response)
        
        # Handle Native Calls
        if native_calls:
            for call in native_calls:
                tool_name = call["name"]
                tool_args = call["args"]
                try:
                    print(f"[GroqProvider] Executing native tool: {tool_name}")
                    if tool_name in tool_map:
                        # Invoke tool with its standard interface
                        tool_res = tool_map[tool_name].invoke(tool_args)
                        messages.append(ToolMessage(tool_call_id=call["id"], name=tool_name, content=str(tool_res)))
                    else:
                        messages.append(ToolMessage(tool_call_id=call["id"], name=tool_name, content=f"Error: Tool {tool_name} not found."))
                except Exception as e:
                    messages.append(ToolMessage(tool_call_id=call["id"], name=tool_name, content=f"Error: {str(e)}"))
        
        # Handle Manual JSON Call
        elif manual_call:
            tool_name = manual_call["name"]
            tool_args = manual_call["arguments"]
            try:
                print(f"[GroqProvider] Executing manual tool: {tool_name}")
                if tool_name in tool_map:
                    # For manual calls, we simulate a response as if it came from the tool system
                    tool_res = tool_map[tool_name].invoke(tool_args)
                    messages.append(HumanMessage(content=f"TOOL_RESULT ({tool_name}): {tool_res}"))
                else:
                    messages.append(HumanMessage(content=f"TOOL_ERROR: Tool {tool_name} not found."))
            except Exception as e:
                messages.append(HumanMessage(content=f"TOOL_ERROR: {str(e)}"))

    # Final invocation after max iterations
    print("[GroqProvider] Max iterations reached or loop ended, generating final response.")
    final_response = llm.invoke(messages)
    return final_response.content
