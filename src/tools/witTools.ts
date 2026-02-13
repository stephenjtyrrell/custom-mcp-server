import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const witTools: Tool[] = [
  {
    name: "mcp_ado_wit_get_work_item",
    description: "Get a single work item by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The work item ID",
        },
        project: {
          type: "string",
          description:
            "The project name (optional, work item IDs are globally unique)",
        },
        expand: {
          type: "string",
          description: "Expand options (None, Relations, Fields, Links, All)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "mcp_ado_wit_get_work_items_batch_by_ids",
    description: "Retrieve multiple work items by IDs in batch",
    inputSchema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "number" },
          description: "Array of work item IDs",
        },
        project: {
          type: "string",
          description: "The project name",
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description: "Specific fields to return",
        },
      },
      required: ["ids", "project"],
    },
  },
  {
    name: "mcp_ado_wit_create_work_item",
    description: "Create a new work item",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        workItemType: {
          type: "string",
          description: "Work item type (e.g., 'Task', 'Bug', 'User Story')",
        },
        title: {
          type: "string",
          description: "Work item title",
        },
        description: {
          type: "string",
          description: "Work item description",
        },
        assignedTo: {
          type: "string",
          description: "User to assign the work item to",
        },
        state: {
          type: "string",
          description: "Work item state",
        },
        tags: {
          type: "string",
          description: "Semicolon-separated tags",
        },
      },
      required: ["project", "workItemType", "title"],
    },
  },
  {
    name: "mcp_ado_wit_update_work_item",
    description: "Update a work item by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The work item ID",
        },
        project: {
          type: "string",
          description: "The project name",
        },
        title: {
          type: "string",
          description: "Updated title",
        },
        description: {
          type: "string",
          description: "Updated description",
        },
        state: {
          type: "string",
          description: "Updated state",
        },
        assignedTo: {
          type: "string",
          description: "Updated assignee",
        },
        tags: {
          type: "string",
          description: "Updated tags (semicolon-separated)",
        },
      },
      required: ["id", "project"],
    },
  },
  {
    name: "mcp_ado_wit_my_work_items",
    description: "Retrieve work items assigned to the current user",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "Project name to filter by (optional)",
        },
        state: {
          type: "string",
          description: "State filter (e.g., 'Active', 'New')",
        },
        type: {
          type: "string",
          description: "Work item type filter",
        },
        top: {
          type: "number",
          description: "Maximum number of items to return (default: 100)",
        },
      },
    },
  },
  {
    name: "mcp_ado_wit_add_work_item_comment",
    description: "Add a comment to a work item",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        workItemId: {
          type: "number",
          description: "The work item ID",
        },
        comment: {
          type: "string",
          description: "Comment text",
        },
      },
      required: ["project", "workItemId", "comment"],
    },
  },
  {
    name: "mcp_ado_wit_list_work_item_comments",
    description: "List comments on a work item",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        workItemId: {
          type: "number",
          description: "The work item ID",
        },
        top: {
          type: "number",
          description: "Maximum number of comments to return",
        },
      },
      required: ["project", "workItemId"],
    },
  },
  {
    name: "mcp_ado_wit_get_query_results_by_id",
    description: "Execute a work item query by ID and get results",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        queryId: {
          type: "string",
          description: "The query ID (GUID)",
        },
        top: {
          type: "number",
          description: "Maximum number of results",
        },
      },
      required: ["project", "queryId"],
    },
  },
];
