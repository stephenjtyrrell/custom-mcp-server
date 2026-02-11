#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as azdev from "azure-devops-node-api";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const AZURE_DEVOPS_ORG_URL = process.env.AZURE_DEVOPS_ORG_URL;
const AZURE_DEVOPS_PAT = process.env.AZURE_DEVOPS_PAT;

if (!AZURE_DEVOPS_ORG_URL || !AZURE_DEVOPS_PAT) {
  console.error("Error: AZURE_DEVOPS_ORG_URL and AZURE_DEVOPS_PAT must be set in environment variables");
  process.exit(1);
}

// Initialize Azure DevOps connection
const authHandler = azdev.getPersonalAccessTokenHandler(AZURE_DEVOPS_PAT);
const connection = new azdev.WebApi(AZURE_DEVOPS_ORG_URL, authHandler);

// Define available tools
const tools: Tool[] = [
  {
    name: "get_work_item",
    description: "Retrieve a work item by its ID from Azure DevOps",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The work item ID",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "query_work_items",
    description: "Query work items using WIQL (Work Item Query Language)",
    inputSchema: {
      type: "object",
      properties: {
        wiql: {
          type: "string",
          description: "The WIQL query string (e.g., 'SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project')",
        },
        project: {
          type: "string",
          description: "The project name (optional)",
        },
      },
      required: ["wiql"],
    },
  },
  {
    name: "list_projects",
    description: "List all projects in the Azure DevOps organization",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_project_teams",
    description: "Get all teams for a specific project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The project ID or name",
        },
      },
      required: ["projectId"],
    },
  },
];

// Create MCP server
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
  return { tools };
});

// Handle call_tool request  
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: "text",
          text: "No arguments provided",
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case "get_work_item": {
        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const workItem: WorkItem = await witApi.getWorkItem(args.id as number);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(workItem, null, 2),
            },
          ],
        };
      }

      case "query_work_items": {
        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const wiql = {
          query: args.wiql as string,
        };
        
        const queryResult = await witApi.queryByWiql(wiql, {
          project: args.project as string,
        });
        
        // Get full work item details if IDs are returned
        if (queryResult.workItems && queryResult.workItems.length > 0) {
          const ids = queryResult.workItems.map(wi => wi.id!);
          const workItems = await witApi.getWorkItems(ids);
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(workItems, null, 2),
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: "No work items found matching the query.",
            },
          ],
        };
      }

      case "list_projects": {
        const coreApi = await connection.getCoreApi();
        const projects = await coreApi.getProjects();
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      }

      case "get_project_teams": {
        const coreApi = await connection.getCoreApi();
        const teams = await coreApi.getTeams(args.projectId as string);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(teams, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure DevOps On-Premise MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
