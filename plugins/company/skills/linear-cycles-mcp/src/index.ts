#!/usr/bin/env node
/**
 * Linear Cycles MCP Server - CLI Entry Point
 *
 * Runs the MCP server with stdio transport for Claude integration.
 *
 * Usage:
 *   npx @cocal/linear-cycles-mcp
 *   node dist/index.js
 *
 * Environment:
 *   LINEAR_API_KEY - Optional (can be configured via manage_auth tool)
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { isConfigured } from "./auth/keyManager.js";

async function main(): Promise<void> {
  // Check if API key is configured
  if (!isConfigured()) {
    console.error(`
================================================================================
LINEAR CYCLES MCP - FIRST TIME SETUP
================================================================================

No Linear API key found. To configure:

1. Get your API key from: https://linear.app/settings/api

2. Add to ~/.claude/plugins/.env:
   LINEAR_API_KEY=lin_api_...

Or use: manage_auth({ action: "setup", apiKey: "lin_api_..." })

The server is running and ready.
================================================================================
`);
  }

  // Create server and transport (always start, even without auth)
  const server = createServer();
  const transport = new StdioServerTransport();

  // Connect and run
  await server.connect(transport);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
