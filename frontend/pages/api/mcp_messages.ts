import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

// Required to parse JSON optimally 
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

// Direct HTTP POST tool execution handler for stateless Next.js environments
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { name, arguments: args } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Missing tool name in request body." });
  }

  const API_KEY = process.env.SEARCH1_API_KEY || process.env.NEXT_PUBLIC_SEARCH1_API_KEY;
  if (!API_KEY) {
     return res.status(500).json({ error: "SEARCH1_API_KEY is not configured in .env.local." });
  }

  const axiosInstance = axios.create({
    baseURL: "https://api.search1api.com",
    headers: { Authorization: `Bearer ${API_KEY}` },
    timeout: 10000,
  });

  try {
    if (name === "web_search") {
      const { query, search_service = "google", max_results = 5 } = args;
      console.log("Tool called: web_search");
      const response = await axiosInstance.post("/search", { query, search_service, max_results, crawl_results: 0, image: false });
      return res.status(200).json({ content: [{ type: "text", text: JSON.stringify(response.data.results || response.data) }] });
    } 
    else if (name === "news_search") {
      const { query, max_results = 5 } = args;
      console.log("Tool called: news_search");
      const response = await axiosInstance.post("/news", { query, max_results });
      return res.status(200).json({ content: [{ type: "text", text: JSON.stringify(response.data.results || response.data) }] });
    }
    
    return res.status(404).json({ error: `Unknown tool: ${name}` });
  } catch (error: any) {
    console.error(error.response?.data || error.message);
    return res.status(500).json({ error: error.message });
  }
}
