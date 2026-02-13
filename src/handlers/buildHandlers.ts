import * as azdev from "azure-devops-node-api";
import { IBuildApi } from "azure-devops-node-api/BuildApi.js";
import { ToolResponse } from "../types.js";
import {
  validateRequiredParams,
  createErrorResponse,
} from "../utils/validation.js";
import { formatDate } from "../utils/formatting.js";

/**
 * Get the Build API instance
 */
export async function getBuildApi(
  connection: azdev.WebApi
): Promise<IBuildApi> {
  return connection.getBuildApi();
}

/**
 * Handle: mcp_ado_pipelines_get_builds
 */
export async function handleGetBuilds(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project"]);
  if (validation) return validation;

  try {
    const buildApi = await getBuildApi(connection);
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
    output += "| ID | Definition | Status | Result | Started |\n";
    output += "|---|---|---|---|---|\n";

    builds.forEach((build) => {
      const started = formatDate(build.startTime);
      output += `| ${build.id} | ${build.definition?.name} | ${build.status} | ${build.result || "N/A"} | ${started} |\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting builds: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_pipelines_get_build_status
 */
export async function handleGetBuildStatus(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project", "buildId"]);
  if (validation) return validation;

  try {
    const buildApi = await getBuildApi(connection);
    const build = await buildApi.getBuild(
      args.project as string,
      args.buildId as number
    );

    let output = `# Build ${build.id}\n\n`;
    output += `**Definition:** ${build.definition?.name}\n`;
    output += `**Status:** ${build.status}\n`;
    output += `**Result:** ${build.result || "N/A"}\n`;
    output += `**Source Branch:** ${build.sourceBranch}\n`;
    output += `**Started:** ${formatDate(build.startTime)}\n`;
    output += `**Finished:** ${formatDate(build.finishTime)}\n`;
    output += `**Requested By:** ${build.requestedBy?.displayName}\n`;
    output += `**Requested For:** ${build.requestedFor?.displayName}\n`;

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting build status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_pipelines_get_build_definitions
 */
export async function handleGetBuildDefinitions(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project"]);
  if (validation) return validation;

  try {
    const buildApi = await getBuildApi(connection);
    const definitions = await buildApi.getDefinitions(
      args.project as string,
      args.name as string
    );

    let output = `# Build Definitions\n\nFound ${definitions.length} definitions:\n\n`;
    definitions.forEach((def) => {
      output += `## ${def.name}\n`;
      output += `- **ID:** ${def.id}\n`;
      output += `- **Path:** ${def.path}\n`;
      output += `- **Type:** ${def.type}\n`;
      output += `- **Queue Status:** ${def.queueStatus}\n\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting build definitions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
