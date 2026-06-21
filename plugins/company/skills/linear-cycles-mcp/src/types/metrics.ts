/**
 * Cycle Metrics Types
 *
 * Types for cycle analytics and performance metrics.
 */

/**
 * Issue summary within a cycle
 */
export type CycleIssue = {
  id: string;
  identifier: string;
  title: string;
  state: {
    name: string;
    type: string; // "completed", "started", "unstarted", "canceled"
  };
  estimate: number | null;
  completedAt: string | null;
};

/**
 * Cycle performance metrics
 */
export type CycleMetrics = {
  cycleId: string;
  cycleName: string | null;
  cycleNumber: number;

  // Date range
  startsAt: string;
  endsAt: string;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;

  // Issue counts
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  notStartedIssues: number;
  canceledIssues: number;

  // Scope (estimates)
  totalScope: number;
  completedScope: number;
  scopeCompletionRate: number; // percentage

  // Velocity
  issueCompletionRate: number; // percentage
  averageVelocity: number; // issues per day
  projectedCompletion: number; // percentage at cycle end

  // Trend data
  issueCountHistory: Array<number>;
  completedIssueCountHistory: Array<number>;
  scopeHistory: Array<number>;
  completedScopeHistory: Array<number>;
};

/**
 * Input for getting cycle metrics
 */
export type GetCycleMetricsInput = {
  cycleId: string; // Can be UUID or "current"
  teamId?: string; // Required if cycleId is "current"
};

/**
 * Response from metrics query
 */
export type CycleMetricsResponse = {
  success: boolean;
  metrics?: CycleMetrics;
  issues?: Array<CycleIssue>;
  error?: string;
};
