import * as azdev from "azure-devops-node-api";
import { ICoreApi } from "azure-devops-node-api/CoreApi.js";
import { ToolResponse } from "../types.js";
import { validateRequiredParams, createErrorResponse } from "../utils/validation.js";

/**
 * Get the Core API instance
 */
export async function getCoreApi(connection: azdev.WebApi): Promise<ICoreApi> {
  return connection.getCoreApi();
}

/**
 * Handle: mcp_ado_core_list_projects
 */
export async function handleListProjects(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  try {
    const coreApi = await getCoreApi(connection);
    const projects = await coreApi.getProjects(
      args.stateFilter as any,
      args.top as number
    );

    let output = `# Azure DevOps Projects\n\nFound ${projects.length} projects:\n\n`;
    projects.forEach((project) => {
      output += `## ${project.name}\n`;
      output += `- **ID:** ${project.id}\n`;
      output += `- **State:** ${project.state}\n`;
      output += `- **Visibility:** ${project.visibility}\n`;
      if (project.description)
        output += `- **Description:** ${project.description}\n`;
      output += `- **URL:** ${project.url}\n\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing projects: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_core_list_project_teams
 */
export async function handleListProjectTeams(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project"]);
  if (validation) return validation;

  try {
    const coreApi = await getCoreApi(connection);
    const teams = await coreApi.getTeams(
      args.project as string,
      undefined,
      args.top as number
    );

    let output = `# Teams in ${args.project}\n\nFound ${teams.length} teams:\n\n`;
    teams.forEach((team) => {
      output += `## ${team.name}\n`;
      output += `- **ID:** ${team.id}\n`;
      if (team.description) output += `- **Description:** ${team.description}\n`;
      output += `- **URL:** ${team.url}\n\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing teams: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
