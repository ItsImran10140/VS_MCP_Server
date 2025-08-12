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
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const wikipedia_service_js_1 = require("./services/wikipedia.service.js");
function createServer() {
    return new index_js_1.Server({
        name: "wikipedia-mcp-server",
        version: "1.0.0",
    }, {
        capabilities: {
            tools: {},
        },
    });
}
function setupToolHandlers(server) {
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, () => __awaiter(this, void 0, void 0, function* () {
        return {
            tools: [
                {
                    name: "search_wikipedia",
                    description: "Search Wikipedia articles by query",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "Search query for Wikipedia articles",
                            },
                            limit: {
                                type: "number",
                                description: "Number of results to return (default: 5)",
                                default: 5,
                            },
                        },
                        required: ["query"],
                    },
                },
                {
                    name: "get_wikipedia_page",
                    description: "Get full content of a Wikipedia page by title",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "Title of the Wikipedia page",
                            },
                        },
                        required: ["title"],
                    },
                },
                {
                    name: "get_wikipedia_summary",
                    description: "Get summary/introduction of a Wikipedia page by title",
                    inputSchema: {
                        type: "object",
                        properties: {
                            title: {
                                type: "string",
                                description: "Title of the Wikipedia page",
                            },
                        },
                        required: ["title"],
                    },
                },
            ],
        };
    }));
    server.setRequestHandler(types_js_1.CallToolRequestSchema, (request) => __awaiter(this, void 0, void 0, function* () {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                case "search_wikipedia": {
                    const { query, limit = 5 } = args;
                    if (!query) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Query is required");
                    }
                    const results = yield (0, wikipedia_service_js_1.searchWikipediaPages)(query, limit);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(results, null, 2),
                            },
                        ],
                    };
                }
                case "get_wikipedia_page": {
                    const { title } = args;
                    if (!title) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Title is required");
                    }
                    const page = yield (0, wikipedia_service_js_1.getWikipediaPageContent)(title);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(page, null, 2),
                            },
                        ],
                    };
                }
                case "get_wikipedia_summary": {
                    const { title } = args;
                    if (!title) {
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, "Title is required");
                    }
                    const summary = yield (0, wikipedia_service_js_1.getWikipediaPageSummary)(title);
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(summary, null, 2),
                            },
                        ],
                    };
                }
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool ${name} not found`);
            }
        }
        catch (error) {
            if (error instanceof types_js_1.McpError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
        }
    }));
}
function runServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const server = createServer();
        setupToolHandlers(server);
        const transport = new stdio_js_1.StdioServerTransport();
        yield server.connect(transport);
        console.error("Wikipedia MCP Server running on stdio");
    });
}
runServer().catch((error) => {
    console.error("Failed to start server:", error);
    //   process.exit(1);
});
