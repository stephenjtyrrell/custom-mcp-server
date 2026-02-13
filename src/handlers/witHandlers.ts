import * as azdev from "azure-devops-node-api";
import { IWorkItemTrackingApi } from "azure-devops-node-api/WorkItemTrackingApi.js";
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { ToolResponse, JsonPatchOperation } from "../types.js";
import {
  validateRequiredParams,
  createErrorResponse,
} from "../utils/validation.js";
import {
  formatDate,
  sanitizeTableCell,
  escapeWiqlString,
  formatWorkItemFields,
} from "../utils/formatting.js";

/**
 * Get the Work Item Tracking API instance
 */
export async function getWitApi(
  connection: azdev.WebApi
): Promise<IWorkItemTrackingApi> {
  return connection.getWorkItemTrackingApi();
}

/**
 * Handle: mcp_ado_wit_get_work_item
 */
export async function handleGetWorkItem(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["id"]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
    const workItem: WorkItem = await witApi.getWorkItem(
      args.id as number,
      undefined,
      undefined,
      args.expand as any
    );

    const formattedText = formatWorkItemFields(workItem);
    return { content: [{ type: "text", text: formattedText }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting work item: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_get_work_items_batch_by_ids
 */
export async function handleGetWorkItemsBatch(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["ids", "project"]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
    const workItems = await witApi.getWorkItems(args.ids as number[], args.fields as string[]);

    let output = `# Work Items\n\nFound ${workItems.length} work items:\n\n`;
    output +=
      "| ID | Type | Title | State | Assigned To |\n";
    output += "|---|---|---|---|---|\n";

    workItems.forEach((wi) => {
      const f = wi.fields || {};
      const title = sanitizeTableCell(f["System.Title"], 50);
      const assignedTo = f["System.AssignedTo"]?.displayName || "Unassigned";
      output += `| ${wi.id} | ${f["System.WorkItemType"] || ""} | ${title} | ${f["System.State"] || ""} | ${assignedTo} |\n`;
    });

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting work items: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_create_work_item
 */
export async function handleCreateWorkItem(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "project",
    "workItemType",
    "title",
  ]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
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
      content: [
        {
          type: "text",
          text: `# Work Item Created\n\n**ID:** ${workItem.id}\n**Type:** ${args.workItemType}\n**Title:** ${args.title}\n**URL:** ${workItem._links?.html?.href || "N/A"}`,
        },
      ],
    };
  } catch (error) {
    return createErrorResponse(
      `Error creating work item: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_update_work_item
 */
export async function handleUpdateWorkItem(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["id", "project"]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
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
      content: [
        {
          type: "text",
          text: `# Work Item Updated\n\n**ID:** ${workItem.id}\n**Updated successfully**`,
        },
      ],
    };
  } catch (error) {
    return createErrorResponse(
      `Error updating work item: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_my_work_items
 */
export async function handleMyWorkItems(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  try {
    const witApi = await getWitApi(connection);
    const top = Math.min((args.top as number) || 100, 200);

    let wiqlQuery =
      "SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [System.AssignedTo], [System.ChangedDate] FROM WorkItems WHERE [System.AssignedTo] = @Me";

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
      const ids = queryResult.workItems
        .slice(0, top)
        .map((wi) => wi.id!);
      const workItems = await witApi.getWorkItems(ids);

      let output = `# My Work Items\n\nFound ${queryResult.workItems.length} work items (showing ${workItems.length}):\n\n`;
      output +=
        "| ID | Type | Title | State | Changed Date |\n";
      output += "|---|---|---|---|---|\n";

      workItems.forEach((wi) => {
        const f = wi.fields || {};
        const title = sanitizeTableCell(f["System.Title"], 40);
        const changedDate = formatDate(f["System.ChangedDate"]);
        output += `| ${wi.id} | ${f["System.WorkItemType"] || ""} | ${title} | ${f["System.State"] || ""} | ${changedDate} |\n`;
      });

      return { content: [{ type: "text", text: output }] };
    }

    return { content: [{ type: "text", text: "No work items found" }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting my work items: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_add_work_item_comment
 */
export async function handleAddWorkItemComment(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "project",
    "workItemId",
    "comment",
  ]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
    await witApi.addComment(
      {
        text: args.comment as string,
      },
      args.project as string,
      args.workItemId as number
    );

    return {
      content: [
        {
          type: "text",
          text: `Comment added to work item ${args.workItemId}`,
        },
      ],
    };
  } catch (error) {
    return createErrorResponse(
      `Error adding comment: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_list_work_item_comments
 */
export async function handleListWorkItemComments(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, [
    "project",
    "workItemId",
  ]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
    const comments = await witApi.getComments(
      args.project as string,
      args.workItemId as number,
      args.top as number
    );

    let output = `# Comments for Work Item ${args.workItemId}\n\n`;
    if (comments.comments && comments.comments.length > 0) {
      comments.comments.forEach((comment) => {
        output += `## ${comment.createdBy?.displayName || "Unknown"} - ${formatDate(comment.createdDate)}\n`;
        output += `${comment.text}\n\n`;
      });
    } else {
      output += "No comments found.\n";
    }

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return createErrorResponse(
      `Error listing comments: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Handle: mcp_ado_wit_get_query_results_by_id
 */
export async function handleGetQueryResultsById(
  args: any,
  connection: azdev.WebApi
): Promise<ToolResponse> {
  const validation = validateRequiredParams(args, ["project", "queryId"]);
  if (validation) return validation;

  try {
    const witApi = await getWitApi(connection);
    const queryResult = await witApi.queryById(args.queryId as string, {
      project: args.project as string,
    });

    if (queryResult.workItems && queryResult.workItems.length > 0) {
      const top = (args.top as number) || 50;
      const ids = queryResult.workItems
        .slice(0, top)
        .map((wi) => wi.id!);
      const workItems = await witApi.getWorkItems(ids);

      let output = `# Query Results\n\nFound ${queryResult.workItems.length} work items (showing ${workItems.length}):\n\n`;
      output +=
        "| ID | Type | Title | State | Assigned To |\n";
      output += "|---|---|---|---|---|\n";

      workItems.forEach((wi) => {
        const f = wi.fields || {};
        const title = sanitizeTableCell(f["System.Title"], 50);
        const assignedTo = f["System.AssignedTo"]?.displayName || "Unassigned";
        output += `| ${wi.id} | ${f["System.WorkItemType"] || ""} | ${title} | ${f["System.State"] || ""} | ${assignedTo} |\n`;
      });

      return { content: [{ type: "text", text: output }] };
    }

    return { content: [{ type: "text", text: "No work items found" }] };
  } catch (error) {
    return createErrorResponse(
      `Error getting query results: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
