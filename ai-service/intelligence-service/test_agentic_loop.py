"""Unit test for the 2-iteration agentic search loop in GroqProvider."""

import json
from unittest.mock import MagicMock, patch
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage

# Mock the AI configuration before importing provider
with patch("app.services.ai_config.llm", MagicMock()) as mock_llm, \
     patch("app.services.ai_config.llm_with_tools", MagicMock()) as mock_llm_with_tools, \
     patch("app.services.mcp_client.get_mcp_tools", MagicMock(return_value=[])):
    
    from app.providers.groq_provider import call_groq, _extract_json_tool_call

    def test_manual_json_extraction():
        print("Testing manual JSON extraction...")
        content = """Certainly! Here's the tool call:
        ```json
        {
          "name": "web_search",
          "arguments": {
            "query": "Llama 3 release date",
            "search_service": "google"
          }
        }
        ```"""
        result = _extract_json_tool_call(content)
        assert result is not None
        assert result["name"] == "web_search"
        assert result["arguments"]["query"] == "Llama 3 release date"
        print("✅ Manual JSON extraction test passed.")

    def test_agentic_loop_logic():
        print("Testing agentic loop logic (mocked)...")
        # 1. First call returns a tool call (manual JSON)
        # 2. Second call returns the final answer
        
        # Mock the tool list
        mock_tool = MagicMock()
        mock_tool.name = "web_search"
        mock_tool.invoke.return_value = "Llama 3 was released on April 18, 2024."
        
        with patch("app.providers.groq_provider.get_mcp_tools", return_value=[mock_tool]):
            # Mock the LLM to return a tool call first, then text
            first_response = AIMessage(content='```json\n{"name": "web_search", "arguments": {"query": "Llama 3 date"}}\n```')
            second_response = AIMessage(content='Llama 3 was released on April 18, 2024, according to my search.')
            
            # Setup sequence for llm_with_tools.invoke()
            with patch("app.services.ai_config.llm_with_tools.invoke", side_effect=[first_response, second_response]):
                result = call_groq("When was Llama 3 released?", system_prompt="Tester")
                
                print(f"Result: {result}")
                assert "April 18, 2024" in result
                assert mock_tool.invoke.called
                
        print("✅ Agentic loop logic test passed.")

if __name__ == "__main__":
    try:
        test_manual_json_extraction()
        test_agentic_loop_logic()
        print("\n🎉 ALL TESTS PASSED!")
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
