/**
 * Zod Validation Schemas
 *
 * Input validation schemas for all MCP tools.
 */

import { z } from "zod";

/**
 * ISO date string pattern (YYYY-MM-DD)
 */
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * UUID pattern for Linear IDs
 */
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Schema for create_cycle tool
 *
 * Creates a new cycle for a team with required date range.
 */
export const createCycleSchema = z.object({
  teamId: z
    .string()
    .regex(uuidPattern, "teamId must be a valid UUID")
    .describe("The UUID of the team to create the cycle for"),

  name: z
    .string()
    .max(255)
    .optional()
    .describe("Optional name for the cycle (e.g., 'Sprint 42')"),

  startsAt: z
    .string()
    .regex(isoDatePattern, "startsAt must be in YYYY-MM-DD format")
    .describe("Start date of the cycle in ISO format (YYYY-MM-DD)"),

  endsAt: z
    .string()
    .regex(isoDatePattern, "endsAt must be in YYYY-MM-DD format")
    .describe("End date of the cycle in ISO format (YYYY-MM-DD)"),

  description: z
    .string()
    .max(10000)
    .optional()
    .describe("Optional description or goals for the cycle"),
});

export type TCreateCycleInput = z.infer<typeof createCycleSchema>;

/**
 * Base schema for update_cycle tool (used for MCP tool registration)
 */
export const updateCycleBaseSchema = z.object({
  cycleId: z
    .string()
    .regex(uuidPattern, "cycleId must be a valid UUID")
    .describe("The UUID of the cycle to update"),

  name: z.string().max(255).optional().describe("New name for the cycle"),

  startsAt: z
    .string()
    .regex(isoDatePattern, "startsAt must be in YYYY-MM-DD format")
    .optional()
    .describe("New start date in ISO format (YYYY-MM-DD)"),

  endsAt: z
    .string()
    .regex(isoDatePattern, "endsAt must be in YYYY-MM-DD format")
    .optional()
    .describe("New end date in ISO format (YYYY-MM-DD)"),

  description: z
    .string()
    .max(10000)
    .optional()
    .describe("New description for the cycle"),
});

/**
 * Full schema for update_cycle with refinement validation
 */
export const updateCycleSchema = updateCycleBaseSchema.refine(
  (data) =>
    data.name !== undefined ||
    data.startsAt !== undefined ||
    data.endsAt !== undefined ||
    data.description !== undefined,
  {
    message: "At least one field must be provided for update",
  }
);

export type TUpdateCycleInput = z.infer<typeof updateCycleSchema>;

/**
 * Schema for delete_cycle tool
 *
 * Deletes a cycle by ID. This is irreversible.
 */
export const deleteCycleSchema = z.object({
  cycleId: z
    .string()
    .regex(uuidPattern, "cycleId must be a valid UUID")
    .describe("The UUID of the cycle to delete"),
});

export type TDeleteCycleInput = z.infer<typeof deleteCycleSchema>;

/**
 * Base schema for get_cycle_metrics tool (used for MCP tool registration)
 */
export const getCycleMetricsBaseSchema = z.object({
  cycleId: z
    .string()
    .describe(
      'The UUID of the cycle, or "current" to get the active cycle for a team'
    ),

  teamId: z
    .string()
    .regex(uuidPattern, "teamId must be a valid UUID")
    .optional()
    .describe('Required when cycleId is "current" to identify the team'),
});

/**
 * Full schema for get_cycle_metrics with refinement validation
 */
export const getCycleMetricsSchema = getCycleMetricsBaseSchema.refine(
  (data) => {
    // If cycleId is "current", teamId is required
    if (data.cycleId === "current" && !data.teamId) {
      return false;
    }
    // If cycleId is not "current", it must be a valid UUID
    if (data.cycleId !== "current" && !uuidPattern.test(data.cycleId)) {
      return false;
    }
    return true;
  },
  {
    message:
      'teamId is required when cycleId is "current", or cycleId must be a valid UUID',
  }
);

export type TGetCycleMetricsInput = z.infer<typeof getCycleMetricsSchema>;

/**
 * Schema for manage_auth tool
 *
 * First-Time User Experience (FTUE) for API key management.
 */
export const manageAuthSchema = z.object({
  action: z
    .enum(["status", "setup", "remove"])
    .describe(
      "Action to perform: 'status' shows configuration state, 'setup' stores an API key, 'remove' deletes stored key"
    ),

  apiKey: z
    .string()
    .optional()
    .describe(
      "Linear API key (required for 'setup' action). Get one from Linear Settings > API."
    ),
});

export type TManageAuthInput = z.infer<typeof manageAuthSchema>;
