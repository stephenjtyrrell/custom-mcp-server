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
import { IGitApi } from "azure-devops-node-api/GitApi.js";
import { IBuildApi } from "azure-devops-node-api/BuildApi.js";
import { IWikiApi } from "azure-devops-node-api/WikiApi.js";
import { ICoreApi } from "azure-devops-node-api/CoreApi.js";
import { ITestApi } from "azure-devops-node-api/TestApi.js";
import { IWorkApi } from "azure-devops-node-api/WorkApi.js";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import * as dotenv from "dotenv";

// Define patch operation type
interface JsonPatchOperation {
  op: string;
  path: string;
  value?: any;
}

// Load environment variables
dotenv.config();

// Helper function to escape WIQL string values to prevent injection
function escapeWiqlString(value: string): string {
  // Escape single quotes by doubling them (WIQL standard)
  return value.replace(/'/g, "''");
}

// Helper function to format date consistently
function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}

// Helper function to safely truncate and escape text for markdown tables
function sanitizeTableCell(text: string | undefined, maxLength: number = 50): string {
  if (!text) return '';
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ').substring(0, maxLength);
}

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
  // ============ CORE API TOOLS ============
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

  // ============ WORK ITEM TOOLS ============
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
          description: "The project name (optional, work item IDs are globally unique)",
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
          description: "Project name to filter by",
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
      required: ["project"],
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

  // ============ REPOSITORY TOOLS ============
  {
    name: "mcp_ado_repo_list_repos_by_project",
    description: "List all repositories in a project",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name or ID",
        },
      },
      required: ["project"],
    },
  },
  {
    name: "mcp_ado_repo_get_repo_by_name_or_id",
    description: "Get repository details by name or ID",
    inputSchema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          description: "The project name",
        },
        repositoryNameOrId: {
          type: "string",
          description: "Repository name or ID",
        },
      },
      required: ["project", "repositoryNameOrId"],
    },
  },
  {
    name: "mcp_ado_repo_list_branches_by_repo",
    description: "List all branches in a repository",
    inputSchema: {
      type: "object",
      properties: {
        repositoryId: {
          type: "string",
          description: "The repository ID",
        },
        project: {
          type: "string",
          description: "The project name",
        },
      },
      required: ["repositoryId", "project"],
    },
  },
  {
    name: "mcp_ado_repo_get_branch_by_name",
    description: "Get details of a specific branch",
    inputSchema: {
      type: "object",
      properties: {
        repositoryId: {
          type: "string",
          description: "The repository ID",
        },
        branchName: {
          type: "string",
          description: "Branch name (e.g., 'main', 'refs/heads/main')",
        },
        project: {
          type: "string",
          description: "The project name",
        },
      },
      required: ["repositoryId", "branchName", "project"],
    },
  },
  {
    name: "mcp_ado_repo_list_pull_requests_by_repo_or_project",
    description: "List pull requests for a repository or project",
    inputSchema: {
      type: "object",
      properties: {
        repositoryId: {
          type: "string",
          description: "The repository ID",
        },
        project: {
          type: "string",
          description: "The project name",
        },
        status: {
          type: "string",
          description: "PR status filter (active, completed, abandoned, all)",
        },
        targetRefName: {
          type: "string",
          description: "Target branch filter",
        },
        top: {
          type: "number",
          description: "Maximum number of PRs to return",
        },
      },
      required: ["project"],
    },
  },
  {
    name: "mcp_ado_repo_get_pull_request_by_id",
    description: "Get details of a specific pull request",
    inputSchema: {
      type: "object",
      properties: {
        repositoryId: {
          type: "string",
          description: "The repository ID",
        },
        pullRequestId: {
          type: "number",
          description: "The pull request ID",
        },
        project: {
          type: "string",
          description: "The project name",
        },
      },
      required: ["repositoryId", "pullRequestId", "project"],
    },
  },
  {
    name: "mcp_ado_repo_create_pull_request",
    description: "Create a new pull request",
    inputSchema: {
      type: "object",
      properties: {
        repositoryId: {
          type: "string",
          description: "The repository ID",
        },
        project: {
          type: "string",
          description: "The project name",
        },
        sourceRefName: {
          type: "string",
          description: "Source branch (e.g., 'refs/heads/feature')",
        },
        targetRefName: {
          type: "string",
          description: "Target branch (e.g., 'refs/heads/main')",
        },
        title: {
          type: "string",
          description: "PR title",
        },
        description: {
          type: "string",
          description: "PR description",
        },
        isDraft: {
          type: "boolean",
          description: "Create as draft PR",
        },
      },
      required: ["repositoryId", "project", "sourceRefName", "targetRefName", "title"],
    },
  },

  // ============ BUILD/PIPELINE TOOLS ============
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
          description: "Status filter (all, cancelling, completed, inProgress, notStarted, postponed)",
        },
        resultFilter: {
          type: "string",
          description: "Result filter (succeeded, partiallySucceeded, failed, canceled)",
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

  // ============ WIKI TOOLS ============
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

  // ============ SEARCH TOOLS ============
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

  // ============ WORK/ITERATION TOOLS ============
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
      // ============ CORE API HANDLERS ============
      case "mcp_ado_core_list_projects": {
        const coreApi: ICoreApi = await connection.getCoreApi();
        const projects = await coreApi.getProjects(
          args.stateFilter as any,
          args.top as number
        );
        
        let output = `# Azure DevOps Projects\n\nFound ${projects.length} projects:\n\n`;
        projects.forEach(project => {
          output += `## ${project.name}\n`;
          output += `- **ID:** ${project.id}\n`;
          output += `- **State:** ${project.state}\n`;
          output += `- **Visibility:** ${project.visibility}\n`;
          if (project.description) output += `- **Description:** ${project.description}\n`;
          output += `- **URL:** ${project.url}\n\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_core_list_project_teams": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const coreApi: ICoreApi = await connection.getCoreApi();
        const teams = await coreApi.getTeams(
          args.project as string,
          undefined,
          args.top as number
        );
        
        let output = `# Teams in ${args.project}\n\nFound ${teams.length} teams:\n\n`;
        teams.forEach(team => {
          output += `## ${team.name}\n`;
          output += `- **ID:** ${team.id}\n`;
          if (team.description) output += `- **Description:** ${team.description}\n`;
          output += `- **URL:** ${team.url}\n\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      // ============ WORK ITEM HANDLERS ============
      case "mcp_ado_wit_get_work_item": {
        if (!args.id) {
          return {
            content: [{ type: "text", text: "Missing required parameter: id" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const workItem: WorkItem = await witApi.getWorkItem(
          args.id as number,
          undefined,
          undefined,
          args.expand as any
        );
        
        const fields = workItem.fields || {};
        const formattedText = `# Work Item ${workItem.id}

**Type:** ${fields['System.WorkItemType'] || 'N/A'}
**Title:** ${fields['System.Title'] || 'N/A'}
**State:** ${fields['System.State'] || 'N/A'}
**Assigned To:** ${fields['System.AssignedTo']?.displayName || 'Unassigned'}
**Priority:** ${fields['Microsoft.VSTS.Common.Priority'] || 'N/A'}
**Created By:** ${fields['System.CreatedBy']?.displayName || 'N/A'}
**Created Date:** ${formatDate(fields['System.CreatedDate'])}
**Changed Date:** ${formatDate(fields['System.ChangedDate'])}

## Description
${fields['System.Description'] || 'No description'}

## Tags
${fields['System.Tags'] || 'None'}

## URL
${workItem._links?.html?.href || 'N/A'}`;
        
        return { content: [{ type: "text", text: formattedText }] };
      }

      case "mcp_ado_wit_get_work_items_batch_by_ids": {
        if (!args.ids || !args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameters: ids and project" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const workItems = await witApi.getWorkItems(
          args.ids as number[],
          args.fields as string[]
        );
        
        let output = `# Work Items\n\nFound ${workItems.length} work items:\n\n`;
        output += '| ID | Type | Title | State | Assigned To |\n';
        output += '|---|---|---|---|---|\n';
        
        workItems.forEach(wi => {
          const f = wi.fields || {};
          const title = sanitizeTableCell(f['System.Title'], 50);
          const assignedTo = f['System.AssignedTo']?.displayName || 'Unassigned';
          output += `| ${wi.id} | ${f['System.WorkItemType'] || ''} | ${title} | ${f['System.State'] || ''} | ${assignedTo} |\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_wit_create_work_item": {
        if (!args.project || !args.workItemType || !args.title) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, workItemType, title" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const patchDocument: JsonPatchOperation[] = [
          {
            op: "add",
            path: "/fields/System.Title",
            value: args.title,
          },
        ];

        if (args.description) {
          patchDocument.push({
            op: "add",
            path: "/fields/System.Description",
            value: args.description,
          });
        }

        if (args.assignedTo) {
          patchDocument.push({
            op: "add",
            path: "/fields/System.AssignedTo",
            value: args.assignedTo,
          });
        }

        if (args.state) {
          patchDocument.push({
            op: "add",
            path: "/fields/System.State",
            value: args.state,
          });
        }

        if (args.tags) {
          patchDocument.push({
            op: "add",
            path: "/fields/System.Tags",
            value: args.tags,
          });
        }

        const workItem = await witApi.createWorkItem(
          undefined,
          patchDocument,
          args.project as string,
          args.workItemType as string
        );

        return {
          content: [{
            type: "text",
            text: `# Work Item Created\n\n**ID:** ${workItem.id}\n**Type:** ${args.workItemType}\n**Title:** ${args.title}\n**URL:** ${workItem._links?.html?.href || 'N/A'}`
          }]
        };
      }

      case "mcp_ado_wit_update_work_item": {
        if (!args.id || !args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameters: id and project" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const patchDocument: JsonPatchOperation[] = [];

        if (args.title) {
          patchDocument.push({
            op: "replace",
            path: "/fields/System.Title",
            value: args.title,
          });
        }

        if (args.description) {
          patchDocument.push({
            op: "replace",
            path: "/fields/System.Description",
            value: args.description,
          });
        }

        if (args.state) {
          patchDocument.push({
            op: "replace",
            path: "/fields/System.State",
            value: args.state,
          });
        }

        if (args.assignedTo) {
          patchDocument.push({
            op: "replace",
            path: "/fields/System.AssignedTo",
            value: args.assignedTo,
          });
        }

        if (args.tags) {
          patchDocument.push({
            op: "replace",
            path: "/fields/System.Tags",
            value: args.tags,
          });
        }

        const workItem = await witApi.updateWorkItem(
          undefined,
          patchDocument,
          args.id as number
        );

        return {
          content: [{
            type: "text",
            text: `# Work Item Updated\n\n**ID:** ${workItem.id}\n**Updated successfully**`
          }]
        };
      }

      case "mcp_ado_wit_my_work_items": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const top = Math.min(args.top as number || 100, 200);
        
        let wiqlQuery = "SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.ChangedDate] FROM WorkItems WHERE [System.AssignedTo] = @Me";
        
        if (args.project) {
          const escapedProject = escapeWiqlString(args.project as string);
          wiqlQuery += ` AND [System.TeamProject] = '${escapedProject}'`;
        }
        
        if (args.state) {
          const escapedState = escapeWiqlString(args.state as string);
          wiqlQuery += ` AND [System.State] = '${escapedState}'`;
        }

        if (args.type) {
          const escapedType = escapeWiqlString(args.type as string);
          wiqlQuery += ` AND [System.WorkItemType] = '${escapedType}'`;
        }
        
        wiqlQuery += " ORDER BY [System.ChangedDate] DESC";
        
        const queryResult = await witApi.queryByWiql({ query: wiqlQuery });
        
        if (queryResult.workItems && queryResult.workItems.length > 0) {
          const ids = queryResult.workItems.slice(0, top).map(wi => wi.id!);
          const workItems = await witApi.getWorkItems(ids);
          
          let output = `# My Work Items\n\nFound ${queryResult.workItems.length} work items (showing ${workItems.length}):\n\n`;
          output += '| ID | Type | Title | State | Changed Date |\n';
          output += '|---|---|---|---|---|\n';
          
          workItems.forEach(wi => {
            const f = wi.fields || {};
            const title = sanitizeTableCell(f['System.Title'], 40);
            const changedDate = formatDate(f['System.ChangedDate']);
            output += `| ${wi.id} | ${f['System.WorkItemType'] || ''} | ${title} | ${f['System.State'] || ''} | ${changedDate} |\n`;
          });
          
          return { content: [{ type: "text", text: output }] };
        }
        
        return { content: [{ type: "text", text: "No work items found" }] };
      }

      case "mcp_ado_wit_add_work_item_comment": {
        if (!args.project || !args.workItemId || !args.comment) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, workItemId, comment" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        await witApi.addComment(
          {
            text: args.comment as string,
          },
          args.project as string,
          args.workItemId as number
        );

        return {
          content: [{
            type: "text",
            text: `Comment added to work item ${args.workItemId}`
          }]
        };
      }

      case "mcp_ado_wit_list_work_item_comments": {
        if (!args.project || !args.workItemId) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, workItemId" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const comments = await witApi.getComments(
          args.project as string,
          args.workItemId as number,
          args.top as number
        );

        let output = `# Comments for Work Item ${args.workItemId}\n\n`;
        if (comments.comments && comments.comments.length > 0) {
          comments.comments.forEach(comment => {
            output += `## ${comment.createdBy?.displayName || 'Unknown'} - ${formatDate(comment.createdDate)}\n`;
            output += `${comment.text}\n\n`;
          });
        } else {
          output += "No comments found.\n";
        }

        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_wit_get_query_results_by_id": {
        if (!args.project || !args.queryId) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, queryId" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        const queryResult = await witApi.queryById(
          args.queryId as string,
          {
            project: args.project as string,
          }
        );

        if (queryResult.workItems && queryResult.workItems.length > 0) {
          const top = args.top as number || 50;
          const ids = queryResult.workItems.slice(0, top).map(wi => wi.id!);
          const workItems = await witApi.getWorkItems(ids);
          
          let output = `# Query Results\n\nFound ${queryResult.workItems.length} work items (showing ${workItems.length}):\n\n`;
          output += '| ID | Type | Title | State | Assigned To |\n';
          output += '|---|---|---|---|---|\n';
          
          workItems.forEach(wi => {
            const f = wi.fields || {};
            const title = sanitizeTableCell(f['System.Title'], 50);
            const assignedTo = f['System.AssignedTo']?.displayName || 'Unassigned';
            output += `| ${wi.id} | ${f['System.WorkItemType'] || ''} | ${title} | ${f['System.State'] || ''} | ${assignedTo} |\n`;
          });
          
          return { content: [{ type: "text", text: output }] };
        }
        
        return { content: [{ type: "text", text: "No work items found" }] };
      }

      // ============ REPOSITORY HANDLERS ============
      case "mcp_ado_repo_list_repos_by_project": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const repos = await gitApi.getRepositories(args.project as string);
        
        let output = `# Repositories in ${args.project}\n\nFound ${repos.length} repositories:\n\n`;
        repos.forEach(repo => {
          output += `## ${repo.name}\n`;
          output += `- **ID:** ${repo.id}\n`;
          output += `- **Default Branch:** ${repo.defaultBranch || 'N/A'}\n`;
          output += `- **URL:** ${repo.remoteUrl}\n`;
          output += `- **Web URL:** ${repo.webUrl}\n\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_repo_get_repo_by_name_or_id": {
        if (!args.project || !args.repositoryNameOrId) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, repositoryNameOrId" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const repo = await gitApi.getRepository(
          args.repositoryNameOrId as string,
          args.project as string
        );
        
        let output = `# Repository: ${repo.name}\n\n`;
        output += `- **ID:** ${repo.id}\n`;
        output += `- **Default Branch:** ${repo.defaultBranch || 'N/A'}\n`;
        output += `- **Size:** ${repo.size} bytes\n`;
        output += `- **Remote URL:** ${repo.remoteUrl}\n`;
        output += `- **Web URL:** ${repo.webUrl}\n`;
        output += `- **Project:** ${repo.project?.name}\n`;
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_repo_list_branches_by_repo": {
        if (!args.repositoryId || !args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameters: repositoryId, project" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const branches = await gitApi.getBranches(
          args.repositoryId as string,
          args.project as string
        );
        
        let output = `# Branches\n\nFound ${branches.length} branches:\n\n`;
        branches.forEach(branch => {
          output += `- **${branch.name}**\n`;
          if (branch.commit) {
            output += `  - Commit: ${branch.commit.commitId?.substring(0, 8)}\n`;
            output += `  - Author: ${branch.commit.author?.name}\n`;
            output += `  - Date: ${formatDate(branch.commit.author?.date)}\n`;
          }
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_repo_get_branch_by_name": {
        if (!args.repositoryId || !args.branchName || !args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameters: repositoryId, branchName, project" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const branchName = args.branchName as string;
        const fullBranchName = branchName.startsWith('refs/heads/') ? branchName : `refs/heads/${branchName}`;
        
        const branch = await gitApi.getBranch(
          args.repositoryId as string,
          fullBranchName,
          args.project as string
        );
        
        let output = `# Branch: ${branch.name}\n\n`;
        if (branch.commit) {
          output += `**Commit:** ${branch.commit.commitId}\n`;
          output += `**Author:** ${branch.commit.author?.name}\n`;
          output += `**Email:** ${branch.commit.author?.email}\n`;
          output += `**Date:** ${formatDate(branch.commit.author?.date)}\n`;
          output += `**Comment:** ${branch.commit.comment}\n`;
        }
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_repo_list_pull_requests_by_repo_or_project": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const searchCriteria: any = {
          status: args.status || 'active',
        };
        
        if (args.targetRefName) {
          searchCriteria.targetRefName = args.targetRefName;
        }
        
        const prs = await gitApi.getPullRequests(
          args.repositoryId as string,
          searchCriteria,
          args.project as string,
          undefined,
          0,
          args.top as number || 50
        );
        
        let output = `# Pull Requests\n\nFound ${prs.length} pull requests:\n\n`;
        output += '| ID | Title | Status | Created By | Created Date |\n';
        output += '|---|---|---|---|---|\n';
        
        prs.forEach(pr => {
          const title = sanitizeTableCell(pr.title!, 50);
          const createdBy = pr.createdBy?.displayName || 'Unknown';
          const createdDate = formatDate(pr.creationDate);
          output += `| ${pr.pullRequestId} | ${title} | ${pr.status} | ${createdBy} | ${createdDate} |\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_repo_get_pull_request_by_id": {
        if (!args.repositoryId || !args.pullRequestId || !args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameters: repositoryId, pullRequestId, project" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const pr = await gitApi.getPullRequest(
          args.repositoryId as string,
          args.pullRequestId as number,
          args.project as string
        );
        
        let output = `# Pull Request ${pr.pullRequestId}\n\n`;
        output += `**Title:** ${pr.title}\n`;
        output += `**Status:** ${pr.status}\n`;
        output += `**Created By:** ${pr.createdBy?.displayName}\n`;
        output += `**Created Date:** ${formatDate(pr.creationDate)}\n`;
        output += `**Source Branch:** ${pr.sourceRefName}\n`;
        output += `**Target Branch:** ${pr.targetRefName}\n`;
        output += `**URL:** ${pr.url}\n\n`;
        output += `## Description\n${pr.description || 'No description'}\n`;
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_repo_create_pull_request": {
        if (!args.repositoryId || !args.project || !args.sourceRefName || !args.targetRefName || !args.title) {
          return {
            content: [{ type: "text", text: "Missing required parameters" }],
            isError: true,
          };
        }

        const gitApi: IGitApi = await connection.getGitApi();
        const pr = await gitApi.createPullRequest(
          {
            title: args.title as string,
            description: args.description as string,
            sourceRefName: args.sourceRefName as string,
            targetRefName: args.targetRefName as string,
            isDraft: args.isDraft as boolean,
          },
          args.repositoryId as string,
          args.project as string
        );
        
        return {
          content: [{
            type: "text",
            text: `# Pull Request Created\n\n**ID:** ${pr.pullRequestId}\n**Title:** ${pr.title}\n**URL:** ${pr.url}`
          }]
        };
      }

      // ============ BUILD/PIPELINE HANDLERS ============
      case "mcp_ado_pipelines_get_builds": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const buildApi: IBuildApi = await connection.getBuildApi();
        const builds = await buildApi.getBuilds(
          args.project as string,
          args.definitions as number[],
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          args.statusFilter as any,
          args.resultFilter as any,
          undefined,
          undefined,
          args.top as number
        );
        
        let output = `# Builds\n\nFound ${builds.length} builds:\n\n`;
        output += '| ID | Definition | Status | Result | Started |\n';
        output += '|---|---|---|---|---|\n';
        
        builds.forEach(build => {
          const started = formatDate(build.startTime);
          output += `| ${build.id} | ${build.definition?.name} | ${build.status} | ${build.result || 'N/A'} | ${started} |\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_pipelines_get_build_status": {
        if (!args.project || !args.buildId) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, buildId" }],
            isError: true,
          };
        }

        const buildApi: IBuildApi = await connection.getBuildApi();
        const build = await buildApi.getBuild(
          args.project as string,
          args.buildId as number
        );
        
        let output = `# Build ${build.id}\n\n`;
        output += `**Definition:** ${build.definition?.name}\n`;
        output += `**Status:** ${build.status}\n`;
        output += `**Result:** ${build.result || 'N/A'}\n`;
        output += `**Source Branch:** ${build.sourceBranch}\n`;
        output += `**Started:** ${formatDate(build.startTime)}\n`;
        output += `**Finished:** ${formatDate(build.finishTime)}\n`;
        output += `**Requested By:** ${build.requestedBy?.displayName}\n`;
        output += `**Requested For:** ${build.requestedFor?.displayName}\n`;
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_pipelines_get_build_definitions": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const buildApi: IBuildApi = await connection.getBuildApi();
        const definitions = await buildApi.getDefinitions(
          args.project as string,
          args.name as string
        );
        
        let output = `# Build Definitions\n\nFound ${definitions.length} definitions:\n\n`;
        definitions.forEach(def => {
          output += `## ${def.name}\n`;
          output += `- **ID:** ${def.id}\n`;
          output += `- **Path:** ${def.path}\n`;
          output += `- **Type:** ${def.type}\n`;
          output += `- **Queue Status:** ${def.queueStatus}\n\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      // ============ WIKI HANDLERS ============
      case "mcp_ado_wiki_list_wikis": {
        const wikiApi: IWikiApi = await connection.getWikiApi();
        const wikis = await wikiApi.getAllWikis(args.project as string);
        
        let output = `# Wikis\n\nFound ${wikis.length} wikis:\n\n`;
        wikis.forEach(wiki => {
          output += `## ${wiki.name}\n`;
          output += `- **ID:** ${wiki.id}\n`;
          output += `- **Type:** ${wiki.type}\n`;
          if (wiki.projectId) output += `- **Project ID:** ${wiki.projectId}\n`;
          output += `- **URL:** ${wiki.url}\n\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_wiki_get_page_content": {
        if (!args.wikiIdentifier || !args.project || !args.path) {
          return {
            content: [{ type: "text", text: "Missing required parameters: wikiIdentifier, project, path" }],
            isError: true,
          };
        }

        const wikiApi: IWikiApi = await connection.getWikiApi();
        const page = await wikiApi.getPageText(
          args.project as string,
          args.wikiIdentifier as string,
          args.path as string
        );
        
        return { content: [{ type: "text", text: page }] };
      }

      case "mcp_ado_wiki_list_pages": {
        if (!args.wikiIdentifier || !args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameters: wikiIdentifier, project" }],
            isError: true,
          };
        }

        const wikiApi: IWikiApi = await connection.getWikiApi();
        const pages = await wikiApi.getPagesBatch(
          {
            top: 100,
          },
          args.project as string,
          args.wikiIdentifier as string
        );
        
        let output = `# Wiki Pages\n\nFound ${pages.length} pages:\n\n`;
        pages.forEach(page => {
          output += `- **${page.path}** (ID: ${page.id})\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      // ============ SEARCH HANDLERS ============
      case "mcp_ado_search_code": {
        if (!args.searchText) {
          return {
            content: [{ type: "text", text: "Missing required parameter: searchText" }],
            isError: true,
          };
        }

        try {
          // Extract organization name from URL
          const orgUrl = new URL(AZURE_DEVOPS_ORG_URL);
          const orgName = orgUrl.pathname.split('/').filter(Boolean)[0];
          const apiVersion = "7.1-preview.1";
          
          const url = `https://almsearch.dev.azure.com/${orgName}/_apis/search/codesearchresults?api-version=${apiVersion}`;

          const requestBody: any = {
            searchText: args.searchText,
            includeFacets: args.includeFacets || false,
            $skip: args.skip || 0,
            $top: args.top || 5,
          };

          const filters: Record<string, string[]> = {};
          if (args.project && Array.isArray(args.project) && args.project.length > 0) {
            filters.Project = args.project as string[];
          }
          if (args.repository && Array.isArray(args.repository) && args.repository.length > 0) {
            filters.Repository = args.repository as string[];
          }
          if (args.path && Array.isArray(args.path) && args.path.length > 0) {
            filters.Path = args.path as string[];
          }
          if (args.branch && Array.isArray(args.branch) && args.branch.length > 0) {
            filters.Branch = args.branch as string[];
          }

          if (Object.keys(filters).length > 0) {
            requestBody.filters = filters;
          }

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return {
              content: [{ type: "text", text: `Azure DevOps Code Search API error: ${response.status} ${response.statusText}\n${errorText}` }],
              isError: true,
            };
          }

          const resultText = await response.text();
          const resultJson = JSON.parse(resultText);

          // Format the results for better readability
          let output = `# Code Search Results\n\n`;
          output += `Search query: "${args.searchText}"\n\n`;
          
          if (resultJson.count > 0) {
            output += `Found ${resultJson.count} results:\n\n`;
            
            if (resultJson.results) {
              resultJson.results.forEach((result: any, index: number) => {
                output += `## Result ${index + 1}\n`;
                output += `**File:** ${result.path || 'N/A'}\n`;
                output += `**Repository:** ${result.repository?.name || 'N/A'}\n`;
                output += `**Project:** ${result.project?.name || 'N/A'}\n`;
                if (result.contentId) {
                  output += `**Content ID:** ${result.contentId}\n`;
                }
                output += `\n`;
              });
            }
          } else {
            output += `No results found.\n`;
          }

          return { content: [{ type: "text", text: output }] };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error searching code: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
          };
        }
      }

      case "mcp_ado_search_wiki": {
        if (!args.searchText) {
          return {
            content: [{ type: "text", text: "Missing required parameter: searchText" }],
            isError: true,
          };
        }

        try {
          // Extract organization name from URL
          const orgUrl = new URL(AZURE_DEVOPS_ORG_URL);
          const orgName = orgUrl.pathname.split('/').filter(Boolean)[0];
          const apiVersion = "7.1-preview.1";
          
          const url = `https://almsearch.dev.azure.com/${orgName}/_apis/search/wikisearchresults?api-version=${apiVersion}`;

          const requestBody: any = {
            searchText: args.searchText,
            includeFacets: args.includeFacets || false,
            $skip: args.skip || 0,
            $top: args.top || 10,
          };

          const filters: Record<string, string[]> = {};
          if (args.project && Array.isArray(args.project) && args.project.length > 0) {
            filters.Project = args.project as string[];
          }
          if (args.wiki && Array.isArray(args.wiki) && args.wiki.length > 0) {
            filters.Wiki = args.wiki as string[];
          }

          if (Object.keys(filters).length > 0) {
            requestBody.filters = filters;
          }

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64')}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return {
              content: [{ type: "text", text: `Azure DevOps Wiki Search API error: ${response.status} ${response.statusText}\n${errorText}` }],
              isError: true,
            };
          }

          const resultText = await response.text();
          const resultJson = JSON.parse(resultText);

          // Format the results for better readability
          let output = `# Wiki Search Results\n\n`;
          output += `Search query: "${args.searchText}"\n\n`;
          
          if (resultJson.count > 0) {
            output += `Found ${resultJson.count} results:\n\n`;
            
            if (resultJson.results) {
              resultJson.results.forEach((result: any, index: number) => {
                output += `## Result ${index + 1}\n`;
                output += `**Title:** ${result.fileName || 'N/A'}\n`;
                output += `**Path:** ${result.path || 'N/A'}\n`;
                output += `**Wiki:** ${result.wiki?.name || 'N/A'}\n`;
                output += `**Project:** ${result.project?.name || 'N/A'}\n`;
                if (result.hitHighlights) {
                  output += `**Preview:** ${result.hitHighlights}\n`;
                }
                output += `\n`;
              });
            }
          } else {
            output += `No results found.\n`;
          }

          return { content: [{ type: "text", text: output }] };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error searching wiki: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
          };
        }
      }

      case "mcp_ado_search_workitem": {
        if (!args.searchText) {
          return {
            content: [{ type: "text", text: "Missing required parameter: searchText" }],
            isError: true,
          };
        }

        const witApi: IWorkItemTrackingApi = await connection.getWorkItemTrackingApi();
        let wiqlQuery = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.Title] CONTAINS '${escapeWiqlString(args.searchText as string)}'`;
        
        if (args.project) {
          wiqlQuery += ` AND [System.TeamProject] = '${escapeWiqlString(args.project as string)}'`;
        }
        
        const queryResult = await witApi.queryByWiql({ query: wiqlQuery });
        
        if (queryResult.workItems && queryResult.workItems.length > 0) {
          const top = args.top as number || 50;
          const ids = queryResult.workItems.slice(0, top).map(wi => wi.id!);
          const workItems = await witApi.getWorkItems(ids);
          
          let output = `# Search Results\n\nFound ${queryResult.workItems.length} work items (showing ${workItems.length}):\n\n`;
          output += '| ID | Type | Title | State |\n';
          output += '|---|---|---|---|\n';
          
          workItems.forEach(wi => {
            const f = wi.fields || {};
            const title = sanitizeTableCell(f['System.Title'], 60);
            output += `| ${wi.id} | ${f['System.WorkItemType'] || ''} | ${title} | ${f['System.State'] || ''} |\n`;
          });
          
          return { content: [{ type: "text", text: output }] };
        }
        
        return { content: [{ type: "text", text: "No work items found" }] };
      }

      // ============ WORK/ITERATION HANDLERS ============
      case "mcp_ado_work_list_iterations": {
        if (!args.project) {
          return {
            content: [{ type: "text", text: "Missing required parameter: project" }],
            isError: true,
          };
        }

        const workApi: IWorkApi = await connection.getWorkApi();
        const iterations = await workApi.getTeamIterations(
          { project: args.project as string, team: '' } as any
        );
        
        let output = `# Iterations\n\nFound ${iterations.length} iterations:\n\n`;
        iterations.forEach(iter => {
          output += `## ${iter.name}\n`;
          output += `- **ID:** ${iter.id}\n`;
          output += `- **Path:** ${iter.path}\n`;
          if (iter.attributes) {
            output += `- **Start Date:** ${formatDate(iter.attributes.startDate)}\n`;
            output += `- **Finish Date:** ${formatDate(iter.attributes.finishDate)}\n`;
          }
          output += `\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
      }

      case "mcp_ado_work_list_team_iterations": {
        if (!args.project || !args.team) {
          return {
            content: [{ type: "text", text: "Missing required parameters: project, team" }],
            isError: true,
          };
        }

        const workApi: IWorkApi = await connection.getWorkApi();
        const teamContext = {
          project: args.project as string,
          team: args.team as string,
        };
        
        const iterations = await workApi.getTeamIterations(teamContext);
        
        let output = `# Team Iterations\n\nFound ${iterations.length} iterations for team ${args.team}:\n\n`;
        iterations.forEach(iter => {
          output += `## ${iter.name}\n`;
          output += `- **ID:** ${iter.id}\n`;
          output += `- **Path:** ${iter.path}\n`;
          if (iter.attributes) {
            output += `- **Start Date:** ${formatDate(iter.attributes.startDate)}\n`;
            output += `- **Finish Date:** ${formatDate(iter.attributes.finishDate)}\n`;
            output += `- **Time Frame:** ${iter.attributes.timeFrame}\n`;
          }
          output += `\n`;
        });
        
        return { content: [{ type: "text", text: output }] };
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
