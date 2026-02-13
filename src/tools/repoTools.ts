import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const repoTools: Tool[] = [
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
];
