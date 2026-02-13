import * as azdev from "azure-devops-node-api";
import { IWikiApi } from "azure-devops-node-api/WikiApi.js";
import { ToolResponse } from "../types.js";
import {
  validateRequiredParams,
  createErrorResponse,
} from "../utils/validation.js";

/**
 * Get the Wiki API instance
 */
export async function getWikiApi(
  connection: azdev.WebApi
): Promise<IWikiApi> {
  return connection.getWikiApi();
}

/**
 * Handle: mcp_ado_wiki_list_wikis
 */
export async function handleListWikis(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  try {
    const wikiApi = await getWikiApi(connection);
    const wikis = await wikiApi.getAllWikis(args.project as string);

    let output = `# Wikis\n\nFound ${wikis.length} wikis:\n\n`;
    wikis.forEach((wiki) => {
      output += `## ${wiki.name}\n`;
      output += `- **ID:** ${wiki.id}\n`;
      output += `- **Type:** ${wiki.type}\n`;
      if (wiki.projectId)
        output += `- **Project ID:** ${wiki.projectId}\n`;
      output += `- **URL:** ${wiki.url}\n\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing wikis: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wiki_get_page_content
 */
export async function handleGetPageContent(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "wikiIdentifier",
    "project",
    "path",
  ]);
  if (validation) return validation;

  try {
    const wikiApi = await getWikiApi(connection);
    const pageStream = await wikiApi.getPageText(
      args.project as string,
      args.wikiIdentifier as string,
      args.path as string
    );

    // Convert stream to string
    let pageContent = "";
    if (typeof pageStream === "string") {
      pageContent = pageStream;
    } else {
      // If it's a stream, read it
      const chunks: any[] = [];
      for await (const chunk of pageStream as any) {
        chunks.push(chunk);
      }
      pageContent = Buffer.concat(chunks).toString("utf-8");
    }

    return { content: [{ type: "text", text: pageContent }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting page content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wiki_list_pages
 */
export async function handleListPages(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "wikiIdentifier",
    "project",
  ]);
  if (validation) return validation;

  try {
    const wikiApi = await getWikiApi(connection);
    const pages = await wikiApi.getPagesBatch(
      {
        top: 100,
      },
      args.project as string,
      args.wikiIdentifier as string
    );

    let output = `# Wiki Pages\n\nFound ${pages.length} pages:\n\n`;
    pages.forEach((page) => {
      output += `- **${page.path}** (ID: ${page.id})\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing pages: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
