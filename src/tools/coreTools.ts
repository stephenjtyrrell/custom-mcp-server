import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const coreTools: Tool[] = [
  {
    name: "mcp_ado_core_list_projects",
    description: "List all projects in the Azure DevOps organization",
    inputSchema: {
      type: "object",
      properties: {
        stateFilter: {
          type: "string",
          description: "Filter projects by state (all, wellFormed, deleting, new)",
        },
        top: {
          type: "number",
          description: "Number of projects to return",
        },
      },
    },
  },
  {
    name: "mcp_ado_core_list_project_teams",
    description: "List teams within a project",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project ID or name",
        },
        top: {
          type: "number",
          description: "Maximum number of teams to return",
        },
      },
      required: ["project"],
    },
  },
];
