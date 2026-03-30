import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

// Define a global state to persist the server instance across Next.js API hot-reloads
const globalForMCP = global as unknown as { 
  mcpServer?: Server; 
  transport?: SSEServerTransport;
};

if (!globalForMCP.mcpServer) {
  const server = new Server(
    { name: "search1api-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "web_search",
          description: "Perform a web search using Search1API. Excellent for finding real-time career data, news, and technical solutions.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query formulation." },
              search_service: { type: "string", description: "Search engine to use.", default: "google" },
              max_results: { type: "number", description: "Maximum results.", default: 5 },
            },
            required: ["query"],
          },
        },
        {
          name: "news_search",
          description: "Search for the latest news articles using Search1API.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "The news search query formulation." },
              max_results: { type: "number", description: "Maximum results.", default: 5 },
            },
            required: ["query"],
          },
        }
      ]
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const API_KEY = process.env.SEARCH1_API_KEY || process.env.NEXT_PUBLIC_SEARCH1_API_KEY;
    if (!API_KEY) {
      throw new McpError(ErrorCode.InternalError, "SEARCH1_API_KEY is not configured in .env.local.");
    }
    const axiosInstance = axios.create({
      baseURL: "https://api.search1api.com",
      headers: { Authorization: `Bearer ${API_KEY}` },
      timeout: 10000,
    });

    if (request.params.name === "web_search") {
      const { query, search_service = "google", max_results = 5 } = request.params.arguments as any;
      try {
        const response = await axiosInstance.post("/search", {
          query, search_service, max_results, crawl_results: 0, image: false
        });
        return { content: [{ type: "text", text: JSON.stringify(response.data.results || response.data, null, 2) }] };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
      }
    } else if (request.params.name === "news_search") {
      const { query, max_results = 5 } = request.params.arguments as any;
      try {
        const response = await axiosInstance.post("/news", { query, max_results });
        return { content: [{ type: "text", text: JSON.stringify(response.data.results || response.data, null, 2) }] };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: `Error: ${error.message}` }] };
      }
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  });

  globalForMCP.mcpServer = server;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // Specify the companion endpoint that handles the tool POST requests
    const transport = new SSEServerTransport("/api/mcp_messages", res as any);
    globalForMCP.transport = transport;
    await globalForMCP.mcpServer!.connect(transport);
    
    // Explicit headers map per SSE recommendations
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Required for NextJS to actually start streaming!
    
    // Manage socket closure
    res.on("close", () => {
      console.log("SSE client disconnected from MCP server");
    });
    
  } else {
    res.status(405).json({ error: "Method not allowed. Use GET to initialize the SSE stream." });
  }
}
