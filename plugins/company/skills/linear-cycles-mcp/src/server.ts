/**
 * Linear Cycles MCP Server
 *
 * Registers tools for cycle management:
 * - create_cycle: Create a new cycle for a team
 * - update_cycle: Update cycle properties
 * - delete_cycle: Delete a cycle
 * - get_cycle_metrics: Get cycle velocity and completion metrics
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createCycleSchema,
  updateCycleBaseSchema,
  updateCycleSchema,
  deleteCycleSchema,
  getCycleMetricsBaseSchema,
  getCycleMetricsSchema,
  manageAuthSchema,
} from "./schemas/index.js";
import { handleCreateCycle } from "./handlers/createCycle.js";
import { handleUpdateCycle } from "./handlers/updateCycle.js";
import { handleDeleteCycle } from "./handlers/deleteCycle.js";
import { handleGetCycleMetrics } from "./handlers/getCycleMetrics.js";
import { handleManageAuth } from "./handlers/manageAuth.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "linear-cycles",
    version: "1.0.0",
  });

  // Register create_cycle tool
  server.tool(
    "create_cycle",
    "Create a new cycle for a Linear team with specified date range",
    createCycleSchema.shape,
    async (args) => {
      const input = createCycleSchema.parse(args);
      return handleCreateCycle(input);
    }
  );

  // Register update_cycle tool
  // Use base schema for shape (MCP registration), full schema for validation
  server.tool(
    "update_cycle",
    "Update an existing Linear cycle's name, dates, or description",
    updateCycleBaseSchema.shape,
    async (args) => {
      const input = updateCycleSchema.parse(args);
      return handleUpdateCycle(input);
    }
  );

  // Register delete_cycle tool
  server.tool(
    "delete_cycle",
    "Delete a Linear cycle by ID",
    deleteCycleSchema.shape,
    async (args) => {
      const input = deleteCycleSchema.parse(args);
      return handleDeleteCycle(input);
    }
  );

  // Register get_cycle_metrics tool
  // Use base schema for shape (MCP registration), full schema for validation
  server.tool(
    "get_cycle_metrics",
    "Get velocity and completion metrics for a cycle. Use 'current' for the active cycle.",
    getCycleMetricsBaseSchema.shape,
    async (args) => {
      const input = getCycleMetricsSchema.parse(args);
      return handleGetCycleMetrics(input);
    }
  );

  // Register manage_auth tool (FTUE)
  // This tool is always available, even without API key configured
  server.tool(
    "manage_auth",
    "Manage Linear API key authentication. Use 'status' to check, 'setup' to configure, 'remove' to delete.",
    manageAuthSchema.shape,
    async (args) => {
      const input = manageAuthSchema.parse(args);
      return handleManageAuth(input);
    }
  );

  return server;
}
