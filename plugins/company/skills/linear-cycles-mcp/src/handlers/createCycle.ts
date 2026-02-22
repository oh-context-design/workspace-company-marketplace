/**
 * Create Cycle Handler
 *
 * Creates a new cycle for a Linear team.
 */

import type { TCreateCycleInput } from "../schemas/index.js";
import type { TToolResponse } from "./base.js";
import { createErrorResponse } from "./base.js";
import { executeGraphQL } from "../client/linear.js";
import { CREATE_CYCLE_MUTATION } from "../graphql/mutations.js";
import type { TCycle } from "../types/cycle.js";

/**
 * Response type for the cycleCreate mutation
 */
type TCreateCycleResult = {
  cycleCreate: {
    success: boolean;
    cycle?: TCycle;
  };
};

/**
 * Converts a date string (YYYY-MM-DD) to ISO DateTime format
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns ISO DateTime string (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
function toISODateTime(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Formats a date string for display (YYYY-MM-DD)
 *
 * @param isoDate - ISO DateTime string
 * @returns Formatted date string
 */
function formatDateForDisplay(isoDate: string): string {
  return isoDate.split("T")[0];
}

/**
 * Handles the create_cycle tool request
 *
 * @param input - Validated create cycle input
 * @returns Tool response with created cycle or error
 */
export async function handleCreateCycle(
  input: TCreateCycleInput
): Promise<TToolResponse> {
  try {
    // Convert date strings to ISO DateTime format for Linear API
    const variables = {
      teamId: input.teamId,
      name: input.name,
      description: input.description,
      startsAt: toISODateTime(input.startsAt),
      endsAt: toISODateTime(input.endsAt),
    };

    // Execute the mutation
    const result = await executeGraphQL<TCreateCycleResult>(
      CREATE_CYCLE_MUTATION,
      variables
    );

    // Check for success
    if (!result.cycleCreate.success || !result.cycleCreate.cycle) {
      return createErrorResponse("Failed to create cycle", {
        response: result,
      });
    }

    const cycle = result.cycleCreate.cycle;

    // Format display name (use provided name or fallback to "Cycle #N")
    const displayName = cycle.name || `Cycle #${cycle.number}`;

    // Build success response
    const responseText = [
      `✓ Created cycle: ${displayName} (number #${cycle.number})`,
      `ID: ${cycle.id}`,
      `Start: ${formatDateForDisplay(cycle.startsAt)}`,
      `End: ${formatDateForDisplay(cycle.endsAt)}`,
    ].join("\n");

    return {
      content: [{ type: "text", text: responseText }],
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    return createErrorResponse(`Failed to create cycle: ${message}`);
  }
}
