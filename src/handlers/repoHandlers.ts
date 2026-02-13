import * as azdev from "azure-devops-node-api";
import { IGitApi } from "azure-devops-node-api/GitApi.js";
import { ToolResponse } from "../types.js";
import {
  validateRequiredParams,
  createErrorResponse,
} from "../utils/validation.js";
import { formatDate, sanitizeTableCell } from "../utils/formatting.js";

/**
 * Get the Git API instance
 */
export async function getGitApi(
  connection: azdev.WebApi
): Promise<IGitApi> {
  return connection.getGitApi();
}

/**
 * Handle: mcp_ado_repo_list_repos_by_project
 */
export async function handleListReposByProject(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project"]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
    const repos = await gitApi.getRepositories(args.project as string);

    let output = `# Repositories in ${args.project}\n\nFound ${repos.length} repositories:\n\n`;
    repos.forEach((repo) => {
      output += `## ${repo.name}\n`;
      output += `- **ID:** ${repo.id}\n`;
      output += `- **Default Branch:** ${repo.defaultBranch || "N/A"}\n`;
      output += `- **URL:** ${repo.remoteUrl}\n`;
      output += `- **Web URL:** ${repo.webUrl}\n\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing repositories: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_repo_get_repo_by_name_or_id
 */
export async function handleGetRepoByNameOrId(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "project",
    "repositoryNameOrId",
  ]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
    const repo = await gitApi.getRepository(
      args.repositoryNameOrId as string,
      args.project as string
    );

    let output = `# Repository: ${repo.name}\n\n`;
    output += `- **ID:** ${repo.id}\n`;
    output += `- **Default Branch:** ${repo.defaultBranch || "N/A"}\n`;
    output += `- **Size:** ${repo.size} bytes\n`;
    output += `- **Remote URL:** ${repo.remoteUrl}\n`;
    output += `- **Web URL:** ${repo.webUrl}\n`;
    output += `- **Project:** ${repo.project?.name}\n`;

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting repository: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_repo_list_branches_by_repo
 */
export async function handleListBranchesByRepo(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["repositoryId", "project"]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
    const branches = await gitApi.getBranches(
      args.repositoryId as string,
      args.project as string
    );

    let output = `# Branches\n\nFound ${branches.length} branches:\n\n`;
    branches.forEach((branch) => {
      output += `- **${branch.name}**\n`;
      if (branch.commit) {
        output += `  - Commit: ${branch.commit.commitId?.substring(0, 8)}\n`;
        output += `  - Author: ${branch.commit.author?.name}\n`;
        output += `  - Date: ${formatDate(branch.commit.author?.date)}\n`;
      }
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing branches: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_repo_get_branch_by_name
 */
export async function handleGetBranchByName(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "repositoryId",
    "branchName",
    "project",
  ]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
    const branchName = args.branchName as string;
    const fullBranchName = branchName.startsWith("refs/heads/")
      ? branchName
      : `refs/heads/${branchName}`;

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
  } catch (error) {
    return createErrorResponse(
      `Error getting branch: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_repo_list_pull_requests_by_repo_or_project
 */
export async function handleListPullRequests(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project"]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
    const searchCriteria: any = {
      status: args.status || "active",
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
      (args.top as number) || 50
    );

    let output = `# Pull Requests\n\nFound ${prs.length} pull requests:\n\n`;
    output +=
      "| ID | Title | Status | Created By | Created Date |\n";
    output += "|---|---|---|---|---|\n";

    prs.forEach((pr) => {
      const title = sanitizeTableCell(pr.title!, 50);
      const createdBy = pr.createdBy?.displayName || "Unknown";
      const createdDate = formatDate(pr.creationDate);
      output += `| ${pr.pullRequestId} | ${title} | ${pr.status} | ${createdBy} | ${createdDate} |\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing pull requests: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_repo_get_pull_request_by_id
 */
export async function handleGetPullRequestById(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "repositoryId",
    "pullRequestId",
    "project",
  ]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
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
    output += `## Description\n${pr.description || "No description"}\n`;

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting pull request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_repo_create_pull_request
 */
export async function handleCreatePullRequest(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "repositoryId",
    "project",
    "sourceRefName",
    "targetRefName",
    "title",
  ]);
  if (validation) return validation;

  try {
    const gitApi = await getGitApi(connection);
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
      content: [
        {
          type: "text",
          text: `# Pull Request Created\n\n**ID:** ${pr.pullRequestId}\n**Title:** ${pr.title}\n**URL:** ${pr.url}`,
        },
      ],
    };
  } catch (error) {
    return createErrorResponse(
      `Error creating pull request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
