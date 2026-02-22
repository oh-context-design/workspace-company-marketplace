/**
 * Delete Cycle Handler
 *
 * Archives a Linear cycle by ID.
 *
 * Note: Linear uses "archive" semantics rather than hard delete.
 * Issues in the cycle become unassigned from the cycle when archived.
 */

import type { TDeleteCycleInput } from "../schemas/index.js";
import type { TToolResponse } from "./base.js";
import { createSuccessResponse, createErrorResponse } from "./base.js";
import { executeGraphQL } from "../client/linear.js";
import { ARCHIVE_CYCLE_MUTATION, GET_CYCLE_QUERY } from "../graphql/mutations.js";
import type { TCycle } from "../types/cycle.js";

/**
 * Result type for archive cycle mutation
 */
type TArchiveCycleResult = {
  cycleArchive: {
    success: boolean;
  };
};

/**
 * Result type for get cycle query
 */
type TGetCycleResult = {
  cycle: TCycle | null;
};

/**
 * Handles the delete_cycle tool request
 *
 * Archives the specified cycle. Linear uses archive semantics,
 * meaning the cycle is soft-deleted and issues become unassigned.
 *
 * @param input - Validated delete cycle input
 * @returns Tool response with success status or error
 */
export async function handleDeleteCycle(
  input: TDeleteCycleInput
): Promise<TToolResponse> {
  const { cycleId } = input;

  try {
    // Step 1: Fetch cycle to verify it exists and get details for confirmation
    let cycleName: string | null = null;
    let cycleNumber: number | null = null;

    try {
      const cycleResult = await executeGraphQL<TGetCycleResult>(
        GET_CYCLE_QUERY,
        { id: cycleId }
      );

      if (!cycleResult.cycle) {
        return createErrorResponse(
          `Cycle not found: ${cycleId}`,
          {
            cycleId,
            suggestion: "Verify the cycle ID is correct and not already archived",
          }
        );
      }

      cycleName = cycleResult.cycle.name;
      cycleNumber = cycleResult.cycle.number;
    } catch (fetchError) {
      // If we can't fetch the cycle, it might not exist or be already archived
      if (fetchError instanceof Error && fetchError.message.includes("not found")) {
        return createErrorResponse(
          `Cycle not found or already archived: ${cycleId}`,
          {
            cycleId,
            suggestion: "The cycle may have already been archived or the ID is invalid",
          }
        );
      }
      // Re-throw other errors
      throw fetchError;
    }

    // Step 2: Execute archive mutation
    const result = await executeGraphQL<TArchiveCycleResult>(
      ARCHIVE_CYCLE_MUTATION,
      { id: cycleId }
    );

    // Step 3: Handle response
    if (!result.cycleArchive.success) {
      return createErrorResponse(
        "Failed to archive cycle",
        {
          cycleId,
          cycleName,
          cycleNumber,
        }
      );
    }

    // Build descriptive name for confirmation
    const displayName = cycleName
      ? `"${cycleName}" (Cycle #${cycleNumber})`
      : `Cycle #${cycleNumber}`;

    return createSuccessResponse({
      success: true,
      message: `Archived cycle: ${displayName}`,
      cycleId,
      cycleName,
      cycleNumber,
      note: "Cycle has been archived and is no longer active. Issues previously in this cycle are now unassigned.",
    });
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes("not found")) {
        return createErrorResponse(
          `Cycle not found: ${cycleId}`,
          {
            cycleId,
            suggestion: "Verify the cycle ID is correct",
          }
        );
      }

      if (message.includes("permission") || message.includes("unauthorized")) {
        return createErrorResponse(
          "Permission denied: Cannot archive this cycle",
          {
            cycleId,
            suggestion: "Ensure you have permission to manage cycles for this team",
          }
        );
      }

      if (message.includes("already archived") || message.includes("archived")) {
        return createErrorResponse(
          `Cycle is already archived: ${cycleId}`,
          {
            cycleId,
            suggestion: "This cycle has already been archived",
          }
        );
      }

      return createErrorResponse(
        `Failed to archive cycle: ${error.message}`,
        { cycleId }
      );
    }

    return createErrorResponse(
      "An unexpected error occurred while archiving the cycle",
      { cycleId }
    );
  }
}
