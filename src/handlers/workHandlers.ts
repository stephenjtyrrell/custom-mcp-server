import * as azdev from "azure-devops-node-api";
import { IWorkApi } from "azure-devops-node-api/WorkApi.js";
import { ToolResponse } from "../types.js";
import {
  validateRequiredParams,
  createErrorResponse,
} from "../utils/validation.js";
import { formatDate } from "../utils/formatting.js";

/**
 * Get the Work API instance
 */
export async function getWorkApi(
  connection: azdev.WebApi
): Promise<IWorkApi> {
  return connection.getWorkApi();
}

/**
 * Handle: mcp_ado_work_list_iterations
 */
export async function handleListIterations(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project"]);
  if (validation) return validation;

  try {
    const workApi = await getWorkApi(connection);
    const iterations = await workApi.getTeamIterations({
      project: args.project as string,
      team: "",
    } as any);

    let output = `# Iterations\n\nFound ${iterations.length} iterations:\n\n`;
    iterations.forEach((iter) => {
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
  } catch (error) {
    return createErrorResponse(
      `Error listing iterations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_work_list_team_iterations
 */
export async function handleListTeamIterations(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project", "team"]);
  if (validation) return validation;

  try {
    const workApi = await getWorkApi(connection);
    const teamContext = {
      project: args.project as string,
      team: args.team as string,
    };

    const iterations = await workApi.getTeamIterations(teamContext);

    let output = `# Team Iterations\n\nFound ${iterations.length} iterations for team ${args.team}:\n\n`;
    iterations.forEach((iter) => {
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
  } catch (error) {
    return createErrorResponse(
      `Error listing team iterations: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
