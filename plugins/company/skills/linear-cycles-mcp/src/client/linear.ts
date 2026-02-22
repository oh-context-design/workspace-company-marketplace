/**
 * Linear GraphQL Client
 *
 * Authenticated client for Linear API operations.
 * Supports both environment variable and stored config for API key.
 */

import { GraphQLClient } from "graphql-request";
import { getApiKey } from "../auth/keyManager.js";

const LINEAR_API_ENDPOINT = "https://api.linear.app/graphql";

/**
 * Creates an authenticated GraphQL client for Linear API
 *
 * API key resolution order:
 * 1. LINEAR_API_KEY environment variable
 * 2. Stored config file (~/.config/linear-cycles-mcp/config.json)
 *
 * @throws Error if no API key is configured
 */
export function createLinearClient(): GraphQLClient {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      "Linear API key not configured. Use the manage_auth tool to set up authentication."
    );
  }

  return new GraphQLClient(LINEAR_API_ENDPOINT, {
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Singleton client instance
 */
let clientInstance: GraphQLClient | null = null;

/**
 * Gets the singleton Linear client instance
 *
 * Creates the client on first call, returns cached instance thereafter.
 */
export function getLinearClient(): GraphQLClient {
  if (!clientInstance) {
    clientInstance = createLinearClient();
  }
  return clientInstance;
}

/**
 * Resets the singleton client instance
 *
 * Call this when the API key changes (e.g., after manage_auth setup)
 * so that the next getLinearClient() call creates a fresh client
 * with the new credentials.
 */
export function resetLinearClient(): void {
  clientInstance = null;
}

/**
 * Executes a GraphQL query/mutation with error handling
 *
 * @param query - GraphQL query or mutation string
 * @param variables - Query variables
 * @returns Query result
 * @throws Error with formatted message on API errors
 */
export async function executeGraphQL<TResult>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TResult> {
  const client = getLinearClient();

  try {
    const result = await client.request<TResult>(query, variables);
    return result;
  } catch (error) {
    // Format Linear API errors for better debugging
    if (error instanceof Error) {
      const message = error.message;

      // Check for common Linear API errors
      if (message.includes("authentication")) {
        throw new Error("Linear API authentication failed. Check your API key.");
      }
      if (message.includes("not found")) {
        throw new Error(`Resource not found: ${message}`);
      }
      if (message.includes("permission")) {
        throw new Error(`Permission denied: ${message}`);
      }

      throw new Error(`Linear API error: ${message}`);
    }

    throw error;
  }
}
