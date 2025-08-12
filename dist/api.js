"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const wikipedia_service_js_1 = require("./services/wikipedia.service.js");
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const openai = new openai_1.default({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "",
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/api/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query, limit } = req.query;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "Query parameter is required" });
        }
        const searchLimit = limit && typeof limit === "string" ? parseInt(limit, 10) : 5;
        const results = yield (0, wikipedia_service_js_1.searchWikipediaPages)(query, searchLimit);
        res.json({ success: true, data: results });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get Wikipedia page content
app.get("/api/page", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title } = req.query;
        if (!title || typeof title !== "string") {
            return res.status(400).json({ error: "Title parameter is required" });
        }
        const page = yield (0, wikipedia_service_js_1.getWikipediaPageContent)(title);
        res.json({ success: true, data: page });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
// Get Wikipedia page summary
app.get("/api/summary", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title } = req.query;
        if (!title || typeof title !== "string") {
            return res.status(400).json({ error: "Title parameter is required" });
        }
        const summary = yield (0, wikipedia_service_js_1.getWikipediaPageSummary)(title);
        res.json({ success: true, data: summary });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
app.post("/geminiai/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
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
    console.log("API Key length:", ((_a = process.env.OPENROUTER_API_KEY) === null || _a === void 0 ? void 0 : _a.length) || 0);
    // Set streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    try {
        console.log("Making request to OpenRouter...");
        // Create a new OpenAI instance for this request to ensure fresh config
        const openaiInstance = new openai_1.default({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3001",
                "X-Title": process.env.SITE_NAME || "Wikipedia API Server",
            },
        });
        const completion = yield openaiInstance.chat.completions.create({
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
        const content = (_c = (_b = completion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (content) {
            res.write(content);
        }
        else {
            res.write("No response content received");
        }
        res.end();
    }
    catch (error) {
        console.error("OpenRouter Error Details:", {
            message: error.message,
            status: error.status,
            response: (_d = error.response) === null || _d === void 0 ? void 0 : _d.data,
            headers: (_e = error.response) === null || _e === void 0 ? void 0 : _e.headers,
        });
        if (!res.headersSent) {
            res.status(500).json({
                error: "AI service temporarily unavailable",
                details: error.message,
            });
        }
        else {
            res.write("\n\n[AI temporarily unavailable]");
            res.end();
        }
    }
}));
// Test endpoint for OpenRouter
app.post("/api/test-openrouter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const testOpenAI = new openai_1.default({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        });
        const completion = yield testOpenAI.chat.completions.create({
            model: "openai/gpt-oss-20b:free",
            messages: [{ role: "user", content: "Hello" }],
        });
        res.json({
            success: true,
            response: completion.choices[0].message.content,
            apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            apiKeyConfigured: !!process.env.OPENROUTER_API_KEY,
        });
    }
}));
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
