import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import {
  searchWikipediaPages,
  getWikipediaPageContent,
  getWikipediaPageSummary,
} from "./services/wikipedia.service.js";

function createServer(): Server {
  return new Server(
    {
      name: "wikipedia-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
}

function setupToolHandlers(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
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
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_wikipedia": {
          const { query, limit = 5 } = args as {
            query: string;
            limit?: number;
          };
          if (!query) {
            throw new McpError(ErrorCode.InvalidParams, "Query is required");
          }

          const results = await searchWikipediaPages(query, limit);
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
          const { title } = args as { title: string };
          if (!title) {
            throw new McpError(ErrorCode.InvalidParams, "Title is required");
          }

          const page = await getWikipediaPageContent(title);
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
          const { title } = args as { title: string };
          if (!title) {
            throw new McpError(ErrorCode.InvalidParams, "Title is required");
          }

          const summary = await getWikipediaPageSummary(title);
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
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool ${name} not found`
          );
      }
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${errorMessage}`
      );
    }
  });
}

async function runServer(): Promise<void> {
  const server = createServer();
  setupToolHandlers(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wikipedia MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Failed to start server:", error);
  //   process.exit(1);
});
