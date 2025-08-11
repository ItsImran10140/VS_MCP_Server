import express from "express";
import cors from "cors";
import {
  searchWikipediaPages,
  getWikipediaPageContent,
  getWikipediaPageSummary,
} from "./services/wikipedia.service.js";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3001;
const ai = new GoogleGenAI({
  apiKey: process.env.GEN_AI || "",
});
// Middleware
app.use(cors());
app.use(express.json());

// Search Wikipedia articles
app.get("/api/search", async (req, res) => {
  try {
    const { query, limit } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const searchLimit = limit ? parseInt(limit as string, 10) : 5;
    const results = await searchWikipediaPages(query, searchLimit);

    res.json({ success: true, data: results });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get Wikipedia page content
app.get("/api/page", async (req, res) => {
  try {
    const { title } = req.query;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title parameter is required" });
    }

    const page = await getWikipediaPageContent(title);

    res.json({ success: true, data: page });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// Get Wikipedia page summary
app.get("/api/summary", async (req, res) => {
  try {
    const { title } = req.query;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "Title parameter is required" });
    }

    const summary = await getWikipediaPageSummary(title);

    res.json({ success: true, data: summary });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ success: false, error: errorMessage });
  }
});

app.post("/geminiai/chat", async (req, res) => {
  let { text } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Valid 'text' is required." });
  }
  text = text.trim().substring(0, 500);

  // Set streaming headers
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream: any = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    });

    for await (const chunk of stream.stream) {
      const content = chunk.text();
      if (content) res.write(content);
    }

    res.end();
  } catch (e: any) {
    console.error("Gemini Error:", e.message);
    res.write("\n\n[AI temporarily unavailable]");
    res.end();
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Wikipedia API Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wikipedia API Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
