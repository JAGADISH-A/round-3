import sys
import os

# Ensure we can import the app modules
sys.path.append(os.path.abspath(r"c:\Users\jagan\Desktop\nm\ai-service\intelligence-service"))

from app.services.mcp_client import get_mcp_tools

print("Attempting to fetch tools from MCP Server...")
tools = get_mcp_tools()
print(f"Result: {len(tools)} tools fetched.")
if tools:
    for t in tools:
        print(f" - {t.name}: {t.description}")
