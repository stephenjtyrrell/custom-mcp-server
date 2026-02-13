import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const workTools: Tool[] = [
  {
    name: "mcp_ado_work_list_iterations",
    description: "List all iterations in a project",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
      },
      required: ["project"],
    },
  },
  {
    name: "mcp_ado_work_list_team_iterations",
    description: "List iterations for a specific team",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        team: {
          type: "string",
          description: "The team name or ID",
        },
      },
      required: ["project", "team"],
    },
  },
];
