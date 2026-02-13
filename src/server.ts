import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as azdev from "azure-devops-node-api";
import { allTools } from "./tools/index.js";
import { handlers } from "./handlers/index.js";
import { ToolResponse } from "./types.js";
import { createErrorResponse } from "./utils/validation.js";
import { AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PAT } from "./config.js";

/**
 * Initialize the Azure DevOps connection
 */
export function createAzureDevOpsConnection(): azdev.WebApi {
  const authHandler = azdev.getPersonalAccessTokenHandler(AZURE_DEVOPS_PAT!);
  return new azdev.WebApi(AZURE_DEVOPS_ORG_URL!, authHandler);
}

/**
 * Create and configure the MCP server
 */
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: "azure-devops-onprem-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list_tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  // Handle call_tool request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const handler = handlers[name];

      if (!handler) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        } as any;
      }

      const connection = createAzureDevOpsConnection();
      const response = await handler(args, connection);
      return response as any;
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      } as any;
    }
  });

  return server;
}
