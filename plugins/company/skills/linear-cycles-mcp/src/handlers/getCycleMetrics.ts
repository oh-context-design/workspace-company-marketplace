/**
 * Get Cycle Metrics Handler
 *
 * Retrieves velocity and completion metrics for a cycle.
 */

import type { TGetCycleMetricsInput } from "../schemas/index.js";
import type { TToolResponse } from "./base.js";
import type { TCycle } from "../types/cycle.js";
import type { TCycleIssue, TCycleMetrics } from "../types/metrics.js";
import { createErrorResponse } from "./base.js";
import { executeGraphQL } from "../client/linear.js";
import {
  GET_CYCLE_QUERY,
  GET_CURRENT_CYCLE_QUERY,
} from "../graphql/mutations.js";

/**
 * GraphQL response types
 */
type TCycleWithIssues = TCycle & {
  issues: {
    nodes: Array<TCycleIssue>;
  };
};

type TGetCycleResult = {
  cycle: TCycleWithIssues;
};

type TGetCurrentCycleResult = {
  team: {
    activeCycle: TCycleWithIssues | null;
  };
};

/**
 * Calculate days between two dates
 */
function daysBetween(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate metrics from cycle data
 */
function calculateMetrics(cycle: TCycleWithIssues): TCycleMetrics {
  const now = new Date();
  const startsAt = new Date(cycle.startsAt);
  const endsAt = new Date(cycle.endsAt);

  const totalDays = daysBetween(startsAt, endsAt);
  const daysElapsed = Math.max(0, daysBetween(startsAt, now));
  const daysRemaining = Math.max(0, daysBetween(now, endsAt));

  const issues = cycle.issues.nodes;
  const totalIssues = issues.length;

  // Count issues by status type
  const completedIssues = issues.filter(
    (i) => i.state.type === "completed"
  ).length;
  const inProgressIssues = issues.filter(
    (i) => i.state.type === "started"
  ).length;
  const notStartedIssues = issues.filter(
    (i) => i.state.type === "unstarted" || i.state.type === "backlog"
  ).length;
  const canceledIssues = issues.filter(
    (i) => i.state.type === "canceled"
  ).length;

  // Calculate scope (estimates)
  const totalScope = issues.reduce((sum, i) => sum + (i.estimate ?? 0), 0);
  const completedScope = issues
    .filter((i) => i.state.type === "completed")
    .reduce((sum, i) => sum + (i.estimate ?? 0), 0);

  // Calculate rates
  const issueCompletionRate =
    totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
  const scopeCompletionRate =
    totalScope > 0 ? (completedScope / totalScope) * 100 : 0;

  // Calculate velocity (issues per day)
  const averageVelocity =
    daysElapsed > 0 ? completedIssues / daysElapsed : 0;

  // Project completion at cycle end based on current velocity
  const projectedCompletion =
    totalIssues > 0 && totalDays > 0
      ? Math.min(100, ((averageVelocity * totalDays) / totalIssues) * 100)
      : 0;

  return {
    cycleId: cycle.id,
    cycleName: cycle.name,
    cycleNumber: cycle.number,
    startsAt: cycle.startsAt,
    endsAt: cycle.endsAt,
    daysRemaining,
    daysElapsed,
    totalDays,
    totalIssues,
    completedIssues,
    inProgressIssues,
    notStartedIssues,
    canceledIssues,
    totalScope,
    completedScope,
    scopeCompletionRate: Math.round(scopeCompletionRate * 10) / 10,
    issueCompletionRate: Math.round(issueCompletionRate * 10) / 10,
    averageVelocity: Math.round(averageVelocity * 100) / 100,
    projectedCompletion: Math.round(projectedCompletion * 10) / 10,
    issueCountHistory: cycle.issueCountHistory ?? [],
    completedIssueCountHistory: cycle.completedIssueCountHistory ?? [],
    scopeHistory: cycle.scopeHistory ?? [],
    completedScopeHistory: cycle.completedScopeHistory ?? [],
  };
}

/**
 * Count issues by status type for display
 */
type TIssuesByStatus = {
  completed: number;
  started: number;
  unstarted: number;
  backlog: number;
  canceled: number;
};

function countIssuesByStatus(issues: Array<TCycleIssue>): TIssuesByStatus {
  return {
    completed: issues.filter((i) => i.state.type === "completed").length,
    started: issues.filter((i) => i.state.type === "started").length,
    unstarted: issues.filter((i) => i.state.type === "unstarted").length,
    backlog: issues.filter((i) => i.state.type === "backlog").length,
    canceled: issues.filter((i) => i.state.type === "canceled").length,
  };
}

/**
 * Format metrics as ASCII display
 */
function formatMetricsDisplay(
  metrics: TCycleMetrics,
  issuesByStatus: TIssuesByStatus
): string {
  const cycleName = metrics.cycleName ?? `Cycle ${metrics.cycleNumber}`;
  const headerLine = `CYCLE METRICS: ${cycleName}`;

  return `
┌─────────────────────────────────────────────────────────┐
│  ${headerLine.padEnd(55)}│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Completion: ${metrics.issueCompletionRate}%${" ".repeat(42 - String(metrics.issueCompletionRate).length)}│
│  Velocity: ${metrics.completedScope} points${" ".repeat(41 - String(metrics.completedScope).length)}│
│                                                         │
│  Issues by Status:                                      │
│  ● Completed: ${issuesByStatus.completed}${" ".repeat(41 - String(issuesByStatus.completed).length)}│
│  ~ Started: ${issuesByStatus.started}${" ".repeat(43 - String(issuesByStatus.started).length)}│
│  ○ Unstarted: ${issuesByStatus.unstarted}${" ".repeat(41 - String(issuesByStatus.unstarted).length)}│
│  ◐ Backlog: ${issuesByStatus.backlog}${" ".repeat(43 - String(issuesByStatus.backlog).length)}│
│  ✗ Canceled: ${issuesByStatus.canceled}${" ".repeat(42 - String(issuesByStatus.canceled).length)}│
│                                                         │
└─────────────────────────────────────────────────────────┘
`.trim();
}

/**
 * Handles the get_cycle_metrics tool request
 *
 * @param input - Validated get metrics input
 * @returns Tool response with metrics or error
 */
export async function handleGetCycleMetrics(
  input: TGetCycleMetricsInput
): Promise<TToolResponse> {
  try {
    let cycle: TCycleWithIssues;

    if (input.cycleId === "current") {
      // Fetch current active cycle for team
      if (!input.teamId) {
        return createErrorResponse(
          'teamId is required when cycleId is "current"'
        );
      }

      const result = await executeGraphQL<TGetCurrentCycleResult>(
        GET_CURRENT_CYCLE_QUERY,
        { teamId: input.teamId }
      );

      if (!result.team.activeCycle) {
        return createErrorResponse("No active cycle found for this team");
      }

      cycle = result.team.activeCycle;
    } else {
      // Fetch cycle by ID
      const result = await executeGraphQL<TGetCycleResult>(GET_CYCLE_QUERY, {
        id: input.cycleId,
      });

      if (!result.cycle) {
        return createErrorResponse(`Cycle not found: ${input.cycleId}`);
      }

      cycle = result.cycle;
    }

    // Calculate metrics
    const metrics = calculateMetrics(cycle);
    const issuesByStatus = countIssuesByStatus(cycle.issues.nodes);

    // Format display
    const display = formatMetricsDisplay(metrics, issuesByStatus);

    return {
      content: [
        {
          type: "text",
          text: display,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return createErrorResponse(`Failed to get cycle metrics: ${message}`);
  }
}
