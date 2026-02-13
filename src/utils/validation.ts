import { ToolResponse } from "../types.js";

/**
 * Create an error response
 */
export function createErrorResponse(message: string): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
  };
}

/**
 * Validate that required parameters are present
 */
export function validateRequiredParams(
  args: any,
  required: string[]
): ToolResponse | null {
  if (!args) {
    return createErrorResponse("No arguments provided");
  }

  const missing = required.filter((param) => !args[param]);
  if (missing.length > 0) {
    return createErrorResponse(
      `Missing required parameters: ${missing.join(", ")}`
    );
  }

  return null;
}

/**
 * Validate that at least one parameter is present
 */
export function validateAtLeastOneParam(
  args: any,
  params: string[]
): ToolResponse | null {
  if (!args) {
    return createErrorResponse("No arguments provided");
  }

  const hasOne = params.some((param) => args[param]);
  if (!hasOne) {
    return createErrorResponse(
      `At least one of the following parameters is required: ${params.join(", ")}`
    );
  }

  return null;
}

/**
 * Extract and validate array parameter
 */
export function extractArrayParam(
  args: any,
  paramName: string,
  required: boolean = false
): string[] | null {
  const value = args[paramName];

  if (!value) {
    return required ? [] : null;
  }

  if (!Array.isArray(value)) {
    return required ? [] : null;
  }

  return value.length > 0 ? value : null;
}
