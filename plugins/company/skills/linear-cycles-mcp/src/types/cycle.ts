/**
 * Cycle Domain Types
 *
 * TypeScript types for Linear cycle entities and operations.
 */

/**
 * Represents a Linear cycle (sprint)
 */
export type Cycle = {
  id: string;
  number: number;
  name: string | null;
  description: string | null;
  startsAt: string; // ISO date
  endsAt: string; // ISO date
  completedAt: string | null;
  team: {
    id: string;
    name: string;
    key: string;
  };
  issueCountHistory: Array<number>;
  completedIssueCountHistory: Array<number>;
  scopeHistory: Array<number>;
  completedScopeHistory: Array<number>;
  progress: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Input for creating a new cycle
 */
export type CycleCreateInput = {
  teamId: string;
  name?: string;
  description?: string;
  startsAt: string; // ISO date
  endsAt: string; // ISO date
};

/**
 * Input for updating an existing cycle
 */
export type CycleUpdateInput = {
  cycleId: string;
  name?: string;
  description?: string;
  startsAt?: string; // ISO date
  endsAt?: string; // ISO date
};

/**
 * Input for deleting a cycle
 */
export type CycleDeleteInput = {
  cycleId: string;
};

/**
 * Response from cycle mutation operations
 */
export type CycleMutationResponse = {
  success: boolean;
  cycle?: Cycle;
  error?: string;
};
