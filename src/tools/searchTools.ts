import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const searchTools: Tool[] = [
  {
    name: "mcp_ado_search_code",
    description: "Search Azure DevOps Repositories for a given search text",
    inputSchema: {
      type: "object",
      properties: {
        searchText: {
          type: "string",
          description: "Keywords to search for in code repositories",
        },
        project: {
          type: "array",
          items: { type: "string" },
          description: "Filter by projects",
        },
        repository: {
          type: "array",
          items: { type: "string" },
          description: "Filter by repositories",
        },
        path: {
          type: "array",
          items: { type: "string" },
          description: "Filter by paths",
        },
        branch: {
          type: "array",
          items: { type: "string" },
          description: "Filter by branches",
        },
        includeFacets: {
          type: "boolean",
          description: "Include facets in the search results (default: false)",
        },
        skip: {
          type: "number",
          description: "Number of results to skip (default: 0)",
        },
        top: {
          type: "number",
          description: "Maximum number of results to return (default: 5)",
        },
      },
      required: ["searchText"],
    },
  },
  {
    name: "mcp_ado_search_wiki",
    description: "Search Azure DevOps Wiki for a given search text",
    inputSchema: {
      type: "object",
      properties: {
        searchText: {
          type: "string",
          description: "Keywords to search for in wiki pages",
        },
        project: {
          type: "array",
          items: { type: "string" },
          description: "Filter by projects",
        },
        wiki: {
          type: "array",
          items: { type: "string" },
          description: "Filter by wiki names",
        },
        includeFacets: {
          type: "boolean",
          description: "Include facets in the search results (default: false)",
        },
        skip: {
          type: "number",
          description: "Number of results to skip (default: 0)",
        },
        top: {
          type: "number",
          description: "Maximum number of results to return (default: 10)",
        },
      },
      required: ["searchText"],
    },
  },
  {
    name: "mcp_ado_search_workitem",
    description: "Search work items by text",
    inputSchema: {
      type: "object",
      properties: {
        searchText: {
          type: "string",
          description: "Text to search for",
        },
        project: {
          type: "string",
          description: "Project name filter",
        },
        top: {
          type: "number",
          description: "Maximum results (default: 50)",
        },
      },
      required: ["searchText"],
    },
  },
];
