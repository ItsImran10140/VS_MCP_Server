import express from "express";
import cors from "cors";
import {
  searchWikipediaPages,
  getWikipediaPageContent,
  getWikipediaPageSummary,
} from "./services/wikipedia.service.js";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// Middleware
app.use(cors());
app.use(express.json());

app.get("/api/search", async (req, res) => {
  try {
    const { query, limit } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    const searchLimit =
      limit && typeof limit === "string" ? parseInt(limit, 10) : 5;
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

  // Check if API key is available
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY not found in environment variables");
    return res.status(500).json({ error: "OpenRouter API key not configured" });
  }

  console.log("API Key exists:", process.env.OPENROUTER_API_KEY ? "Yes" : "No");
  console.log("API Key length:", process.env.OPENROUTER_API_KEY?.length || 0);

  // Set streaming headers
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    console.log("Making request to OpenRouter...");

    // Create a new OpenAI instance for this request to ensure fresh config
    const openaiInstance = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3001",
        "X-Title": process.env.SITE_NAME || "Wikipedia API Server",
      },
    });

    const completion = await openaiInstance.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    console.log("Response received from OpenRouter");

    // Write only the content, not the entire message object
    const content = completion.choices[0]?.message?.content;
    if (content) {
      res.write(content);
    } else {
      res.write("No response content received");
    }
    res.end();
  } catch (error: any) {
    console.error("OpenRouter Error Details:", {
      message: error.message,
      status: error.status,
      response: error.response?.data,
      headers: error.response?.headers,
    });

    if (!res.headersSent) {
      res.status(500).json({
        error: "AI service temporarily unavailable",
        details: error.message,
      });
    } else {
      res.write("\n\n[AI temporarily unavailable]");
      res.end();
    }
  }
});

// Test endpoint for OpenRouter
app.post("/api/test-openrouter", async (req, res) => {
  try {
    const testOpenAI = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await testOpenAI.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [{ role: "user", content: "Hello" }],
    });

    res.json({
      success: true,
      response: completion.choices[0].message.content,
      apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Wikipedia API Server is running",
    openAIConfigured: !!process.env.OPENROUTER_API_KEY,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Wikipedia API Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
