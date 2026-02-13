import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const wikiTools: Tool[] = [
  {
    name: "mcp_ado_wiki_list_wikis",
    description: "List wikis in organization or project",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Optional project name to filter wikis",
        },
      },
    },
  },
  {
    name: "mcp_ado_wiki_get_page_content",
    description: "Get wiki page content",
    inputSchema: {
      type: "object",
      properties: {
        wikiIdentifier: {
          type: "string",
          description: "Wiki ID or name",
        },
        project: {
          type: "string",
          description: "The project name",
        },
        path: {
          type: "string",
          description: "Page path (e.g., '/page-name')",
        },
      },
      required: ["wikiIdentifier", "project", "path"],
    },
  },
  {
    name: "mcp_ado_wiki_list_pages",
    description: "List pages in a wiki",
    inputSchema: {
      type: "object",
      properties: {
        wikiIdentifier: {
          type: "string",
          description: "Wiki ID or name",
        },
        project: {
          type: "string",
          description: "The project name",
        },
      },
      required: ["wikiIdentifier", "project"],
    },
  },
];
