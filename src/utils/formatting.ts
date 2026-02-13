/**
 * Format a date to YYYY-MM-DD format
 */
export function formatDate(
  dateInput: string | Date | undefined
): string {
  if (!dateInput) return "";
  const date =
    dateInput instanceof Date ? dateInput : new Date(dateInput);
  return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
}

/**
 * Sanitize text for markdown table cells
 * Escapes special characters and truncates if needed
 */
export function sanitizeTableCell(
  text: string | undefined,
  maxLength: number = 50
): string {
  if (!text) return "";
  return text
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .substring(0, maxLength);
}

/**
 * Escape WIQL string values to prevent injection
 * WIQL uses single quote doubling as escape mechanism
 */
export function escapeWiqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Format work item fields for markdown output
 */
export function formatWorkItemFields(
  workItem: any,
  fields: Record<string, any> = {}
): string {
  const defaultFields = workItem.fields || fields;
  return `# Work Item ${workItem.id}

**Type:** ${defaultFields["System.WorkItemType"] || "N/A"}
**Title:** ${defaultFields["System.Title"] || "N/A"}
**State:** ${defaultFields["System.State"] || "N/A"}
**Assigned To:** ${
    defaultFields["System.AssignedTo"]?.displayName || "Unassigned"
  }
**Priority:** ${defaultFields["Microsoft.VSTS.Common.Priority"] || "N/A"}
**Created By:** ${
    defaultFields["System.CreatedBy"]?.displayName || "N/A"
  }
**Created Date:** ${formatDate(defaultFields["System.CreatedDate"])}
**Changed Date:** ${formatDate(defaultFields["System.ChangedDate"])}

## Description
${defaultFields["System.Description"] || "No description"}

## Tags
${defaultFields["System.Tags"] || "None"}

## URL
${workItem._links?.html?.href || "N/A"}`;
}
