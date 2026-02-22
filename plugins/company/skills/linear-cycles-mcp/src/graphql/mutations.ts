/**
 * GraphQL Operations
 *
 * All GraphQL queries and mutations for cycle management.
 */

/**
 * Create a new cycle
 *
 * Variables:
 * - teamId: String! - Team UUID
 * - name: String - Optional cycle name
 * - description: String - Optional description
 * - startsAt: DateTime! - Start date
 * - endsAt: DateTime! - End date
 */
export const CREATE_CYCLE_MUTATION = `
  mutation CreateCycle(
    $teamId: String!
    $name: String
    $description: String
    $startsAt: DateTime!
    $endsAt: DateTime!
  ) {
    cycleCreate(
      input: {
        teamId: $teamId
        name: $name
        description: $description
        startsAt: $startsAt
        endsAt: $endsAt
      }
    ) {
      success
      cycle {
        id
        number
        name
        description
        startsAt
        endsAt
        completedAt
        progress
        createdAt
        updatedAt
        team {
          id
          name
          key
        }
      }
    }
  }
`;

/**
 * Update an existing cycle
 *
 * Variables:
 * - id: String! - Cycle UUID
 * - name: String - Optional new name
 * - description: String - Optional new description
 * - startsAt: DateTime - Optional new start date
 * - endsAt: DateTime - Optional new end date
 */
export const UPDATE_CYCLE_MUTATION = `
  mutation UpdateCycle(
    $id: String!
    $name: String
    $description: String
    $startsAt: DateTime
    $endsAt: DateTime
  ) {
    cycleUpdate(
      id: $id
      input: {
        name: $name
        description: $description
        startsAt: $startsAt
        endsAt: $endsAt
      }
    ) {
      success
      cycle {
        id
        number
        name
        description
        startsAt
        endsAt
        completedAt
        progress
        createdAt
        updatedAt
        team {
          id
          name
          key
        }
      }
    }
  }
`;

/**
 * Archive a cycle (Linear uses archive semantics, not hard delete)
 *
 * Variables:
 * - id: String! - Cycle UUID
 *
 * Note: Issues in the cycle become unassigned from the cycle.
 * The cycle is archived, not permanently deleted.
 */
export const ARCHIVE_CYCLE_MUTATION = `
  mutation ArchiveCycle($id: String!) {
    cycleArchive(id: $id) {
      success
    }
  }
`;

/**
 * Get cycle by ID with full details
 *
 * Variables:
 * - id: String! - Cycle UUID
 */
export const GET_CYCLE_QUERY = `
  query GetCycle($id: String!) {
    cycle(id: $id) {
      id
      number
      name
      description
      startsAt
      endsAt
      completedAt
      progress
      issueCountHistory
      completedIssueCountHistory
      scopeHistory
      completedScopeHistory
      createdAt
      updatedAt
      team {
        id
        name
        key
      }
      issues {
        nodes {
          id
          identifier
          title
          estimate
          completedAt
          state {
            name
            type
          }
        }
      }
    }
  }
`;

/**
 * Get current active cycle for a team
 *
 * Variables:
 * - teamId: String! - Team UUID
 */
export const GET_CURRENT_CYCLE_QUERY = `
  query GetCurrentCycle($teamId: String!) {
    team(id: $teamId) {
      activeCycle {
        id
        number
        name
        description
        startsAt
        endsAt
        completedAt
        progress
        issueCountHistory
        completedIssueCountHistory
        scopeHistory
        completedScopeHistory
        createdAt
        updatedAt
        team {
          id
          name
          key
        }
        issues {
          nodes {
            id
            identifier
            title
            estimate
            completedAt
            state {
              name
              type
            }
          }
        }
      }
    }
  }
`;
