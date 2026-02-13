import * as azdev from "azure-devops-node-api";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { ToolResponse } from "../types.js";
import {
  validateRequiredParams,
  createErrorResponse,
} from "../utils/validation.js";
import {
  sanitizeTableCell,
  escapeWiqlString,
} from "../utils/formatting.js";
import { AZURE_DEVOPS_ORG_URL, AZURE_DEVOPS_PAT } from "../config.js";

/**
 * Get the WIT API instance
 */
export async function getWitApi(
  connection: azdev.WebApi
): Promise<IWorkItemTrackingApi> {
  return connection.getWorkItemTrackingApi();
}

/**
 * Handle: mcp_ado_search_code
 */
export async function handleSearchCode(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["searchText"]);
  if (validation) return validation;

  try {
    const apiVersion = "7.1-preview.1";
    const url = `${AZURE_DEVOPS_ORG_URL}/_apis/search/codesearchresults?api-version=${apiVersion}`;

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
    if (
      args.repository &&
      Array.isArray(args.repository) &&
      args.repository.length > 0
    ) {
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
        Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString("base64")}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResponse(
        `Azure DevOps Code Search API error: ${response.status} ${response.statusText}\nURL: ${url}\nError: ${errorText}`
      );
    }

    const resultText = await response.text();
    const resultJson = JSON.parse(resultText);

    let output = `# Code Search Results\n\n`;
    output += `Search query: "${args.searchText}"\n\n`;

    if (resultJson.count > 0) {
      output += `Found ${resultJson.count} results:\n\n`;

      if (resultJson.results) {
        resultJson.results.forEach((result: any, index: number) => {
          output += `## Result ${index + 1}\n`;
          output += `**File:** ${result.path || "N/A"}\n`;
          output += `**Repository:** ${result.repository?.name || "N/A"}\n`;
          output += `**Project:** ${result.project?.name || "N/A"}\n`;
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
    return createErrorResponse(
      `Error searching code: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_search_wiki
 */
export async function handleSearchWiki(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["searchText"]);
  if (validation) return validation;

  try {
    const apiVersion = "7.1-preview.1";
    const url = `${AZURE_DEVOPS_ORG_URL}/_apis/search/wikisearchresults?api-version=${apiVersion}`;

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
        Authorization: `Basic ${Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString("base64")}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return createErrorResponse(
        `Azure DevOps Wiki Search API error: ${response.status} ${response.statusText}\nURL: ${url}\nError: ${errorText}`
      );
    }

    const resultText = await response.text();
    const resultJson = JSON.parse(resultText);

    let output = `# Wiki Search Results\n\n`;
    output += `Search query: "${args.searchText}"\n\n`;

    if (resultJson.count > 0) {
      output += `Found ${resultJson.count} results:\n\n`;

      if (resultJson.results) {
        resultJson.results.forEach((result: any, index: number) => {
          output += `## Result ${index + 1}\n`;
          output += `**Title:** ${result.fileName || "N/A"}\n`;
          output += `**Path:** ${result.path || "N/A"}\n`;
          output += `**Wiki:** ${result.wiki?.name || "N/A"}\n`;
          output += `**Project:** ${result.project?.name || "N/A"}\n`;
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
    return createErrorResponse(
      `Error searching wiki: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_search_workitem
 */
export async function handleSearchWorkItem(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["searchText"]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
    let wiqlQuery = `SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType] FROM WorkItems WHERE [System.Title] CONTAINS '${escapeWiqlString(args.searchText as string)}'`;

    if (args.project) {
      wiqlQuery += ` AND [System.TeamProject] = '${escapeWiqlString(args.project as string)}'`;
    }

    const queryResult = await witApi.queryByWiql({ query: wiqlQuery });

    if (queryResult.workItems && queryResult.workItems.length > 0) {
      const top = (args.top as number) || 50;
      const ids = queryResult.workItems
        .slice(0, top)
        .map((wi) => wi.id!);
      const workItems = await witApi.getWorkItems(ids);

      let output = `# Search Results\n\nFound ${queryResult.workItems.length} work items (showing ${workItems.length}):\n\n`;
      output +=
        "| ID | Type | Title | State |\n";
      output += "|---|---|---|---|\n";

      workItems.forEach((wi) => {
        const f = wi.fields || {};
        const title = sanitizeTableCell(f["System.Title"], 60);
        output += `| ${wi.id} | ${f["System.WorkItemType"] || ""} | ${title} | ${f["System.State"] || ""} |\n`;
      });

      return { content: [{ type: "text", text: output }] };
    }

    return { content: [{ type: "text", text: "No work items found" }] };
  } catch (error) {
    return createErrorResponse(
      `Error searching work items: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
