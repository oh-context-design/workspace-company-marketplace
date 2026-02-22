/**
 * Update Cycle Handler
 *
 * Updates an existing Linear cycle's properties.
 */

import type { TUpdateCycleInput } from "../schemas/index.js";
import type { TCycle } from "../types/cycle.js";
import type { TToolResponse } from "./base.js";
import { createErrorResponse } from "./base.js";
import { executeGraphQL } from "../client/linear.js";
import { UPDATE_CYCLE_MUTATION } from "../graphql/mutations.js";

/**
 * GraphQL mutation result type
 */
type TUpdateCycleResult = {
  cycleUpdate: {
    success: boolean;
    cycle?: TCycle;
  };
};

/**
 * Converts a YYYY-MM-DD date string to ISO DateTime format
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns ISO DateTime string (e.g., "2024-01-15T00:00:00.000Z")
 */
function toISODateTime(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Builds a list of changed field names for the response message
 *
 * @param input - Update cycle input
 * @returns Array of field names that were updated
 */
function getChangedFields(input: TUpdateCycleInput): Array<string> {
  const fields: Array<string> = [];

  if (input.name !== undefined) fields.push("name");
  if (input.description !== undefined) fields.push("description");
  if (input.startsAt !== undefined) fields.push("startsAt");
  if (input.endsAt !== undefined) fields.push("endsAt");

  return fields;
}

/**
 * Handles the update_cycle tool request
 *
 * @param input - Validated update cycle input
 * @returns Tool response with updated cycle or error
 */
export async function handleUpdateCycle(
  input: TUpdateCycleInput
): Promise<TToolResponse> {
  try {
    // Collect changed fields for response message
    const changedFields = getChangedFields(input);

    // Build variables object with only provided fields
    // This avoids accidentally clearing optional fields
    const variables: Record<string, unknown> = {
      id: input.cycleId,
    };

    if (input.name !== undefined) {
      variables.name = input.name;
    }

    if (input.description !== undefined) {
      variables.description = input.description;
    }

    if (input.startsAt !== undefined) {
      variables.startsAt = toISODateTime(input.startsAt);
    }

    if (input.endsAt !== undefined) {
      variables.endsAt = toISODateTime(input.endsAt);
    }

    // Execute the mutation
    const result = await executeGraphQL<TUpdateCycleResult>(
      UPDATE_CYCLE_MUTATION,
      variables
    );

    // Handle response
    if (!result.cycleUpdate.success) {
      return createErrorResponse("Failed to update cycle", {
        cycleId: input.cycleId,
        attemptedChanges: changedFields,
      });
    }

    const cycle = result.cycleUpdate.cycle;

    if (!cycle) {
      return createErrorResponse("Cycle update succeeded but no cycle data returned", {
        cycleId: input.cycleId,
      });
    }

    // Format success response
    const cycleName = cycle.name || `Cycle ${cycle.number}`;
    const changesText = changedFields.join(", ");

    return {
      content: [
        {
          type: "text",
          text: `✓ Updated cycle: ${cycleName}\nID: ${cycle.id}\nChanges: ${changesText}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return createErrorResponse(`Failed to update cycle: ${message}`, {
      cycleId: input.cycleId,
    });
  }
}
