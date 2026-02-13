import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const buildTools: Tool[] = [
  {
    name: "mcp_ado_pipelines_get_builds",
    description: "List builds for a project",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        definitions: {
          type: "array",
          items: { type: "number" },
          description: "Filter by build definition IDs",
        },
        top: {
          type: "number",
          description: "Maximum number of builds to return",
        },
        statusFilter: {
          type: "string",
          description:
            "Status filter (all, cancelling, completed, inProgress, notStarted, postponed)",
        },
        resultFilter: {
          type: "string",
          description:
            "Result filter (succeeded, partiallySucceeded, failed, canceled)",
        },
      },
      required: ["project"],
    },
  },
  {
    name: "mcp_ado_pipelines_get_build_status",
    description: "Get status of a specific build",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        buildId: {
          type: "number",
          description: "The build ID",
        },
      },
      required: ["project", "buildId"],
    },
  },
  {
    name: "mcp_ado_pipelines_get_build_definitions",
    description: "List build definitions in a project",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        name: {
          type: "string",
          description: "Filter by definition name",
        },
        top: {
          type: "number",
          description: "Maximum number to return",
        },
      },
      required: ["project"],
    },
  },
];
