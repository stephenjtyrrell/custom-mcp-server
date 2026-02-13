import { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * JSON Patch Operation for Azure DevOps API
 */
export interface JsonPatchOperation {
  op: string;
  path: string;
  value?: any;
}

/**
 * Response format from tool handlers
 */
export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Tool definition with metadata and handler
 */
export interface ToolDefinition {
  tool: Tool;
  handler: (args: any) => Promise<ToolResponse>;
}

/**
 * Grouped collection of tools by domain
 */
export interface ToolGroup {
  [key: string]: ToolDefinition[];
}
