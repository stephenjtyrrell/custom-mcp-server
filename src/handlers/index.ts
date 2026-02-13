import * as azdev from "azure-devops-node-api";
import { ToolResponse } from "../types.js";

// Import all handlers
import * as coreHandlers from "./coreHandlers.js";
import * as witHandlers from "./witHandlers.js";
import * as repoHandlers from "./repoHandlers.js";
import * as buildHandlers from "./buildHandlers.js";
import * as wikiHandlers from "./wikiHandlers.js";
import * as searchHandlers from "./searchHandlers.js";
import * as workHandlers from "./workHandlers.js";

/**
 * Handler registry mapping tool names to handler functions
 */
export type HandlerRegistry = {
  [key: string]: (args: any, connection: azdev.WebApi) => Promise<ToolResponse>;
};

export const handlers: HandlerRegistry = {
  // Core handlers
  mcp_ado_core_list_projects: coreHandlers.handleListProjects,
  mcp_ado_core_list_project_teams: coreHandlers.handleListProjectTeams,

  // WIT handlers
  mcp_ado_wit_get_work_item: witHandlers.handleGetWorkItem,
  mcp_ado_wit_get_work_items_batch_by_ids:
    witHandlers.handleGetWorkItemsBatch,
  mcp_ado_wit_create_work_item: witHandlers.handleCreateWorkItem,
  mcp_ado_wit_update_work_item: witHandlers.handleUpdateWorkItem,
  mcp_ado_wit_my_work_items: witHandlers.handleMyWorkItems,
  mcp_ado_wit_add_work_item_comment: witHandlers.handleAddWorkItemComment,
  mcp_ado_wit_list_work_item_comments:
    witHandlers.handleListWorkItemComments,
  mcp_ado_wit_get_query_results_by_id: witHandlers.handleGetQueryResultsById,

  // Repository handlers
  mcp_ado_repo_list_repos_by_project:
    repoHandlers.handleListReposByProject,
  mcp_ado_repo_get_repo_by_name_or_id: repoHandlers.handleGetRepoByNameOrId,
  mcp_ado_repo_list_branches_by_repo: repoHandlers.handleListBranchesByRepo,
  mcp_ado_repo_get_branch_by_name: repoHandlers.handleGetBranchByName,
  mcp_ado_repo_list_pull_requests_by_repo_or_project:
    repoHandlers.handleListPullRequests,
  mcp_ado_repo_get_pull_request_by_id: repoHandlers.handleGetPullRequestById,
  mcp_ado_repo_create_pull_request: repoHandlers.handleCreatePullRequest,

  // Build handlers
  mcp_ado_pipelines_get_builds: buildHandlers.handleGetBuilds,
  mcp_ado_pipelines_get_build_status: buildHandlers.handleGetBuildStatus,
  mcp_ado_pipelines_get_build_definitions:
    buildHandlers.handleGetBuildDefinitions,

  // Wiki handlers
  mcp_ado_wiki_list_wikis: wikiHandlers.handleListWikis,
  mcp_ado_wiki_get_page_content: wikiHandlers.handleGetPageContent,
  mcp_ado_wiki_list_pages: wikiHandlers.handleListPages,

  // Search handlers
  mcp_ado_search_code: searchHandlers.handleSearchCode,
  mcp_ado_search_wiki: searchHandlers.handleSearchWiki,
  mcp_ado_search_workitem: searchHandlers.handleSearchWorkItem,

  // Work handlers
  mcp_ado_work_list_iterations: workHandlers.handleListIterations,
  mcp_ado_work_list_team_iterations: workHandlers.handleListTeamIterations,
};

/**
 * Get a handler by tool name
 */
export function getHandler(
  toolName: string
): ((args: any, connection: azdev.WebApi) => Promise<ToolResponse>) | undefined {
  return handlers[toolName];
}
