#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { validateConfig } from "./config.js";
import { createMcpServer } from "./server.js";

/**
 * Main entry point for the MCP server
 */
async function main() {
  // Validate configuration
  validateConfig();

  // Create and configure the server
  const server = createMcpServer();

  // Start the server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Azure DevOps On-Premise MCP Server running on stdio");
}

// Start the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
