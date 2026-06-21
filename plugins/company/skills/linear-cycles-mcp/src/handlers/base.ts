/**
 * Base Handler Interface
 *
 * Defines the contract for all MCP tool handlers.
 */

/**
 * MCP tool response format
 */
export type ToolResponse = {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
};

/**
 * Creates a successful tool response
 *
 * @param data - Response data to serialize as JSON
 */
export function createSuccessResponse<T>(data: T): ToolResponse {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Creates an error tool response
 *
 * @param message - Error message
 * @param details - Optional additional details
 */
export function createErrorResponse(
  message: string,
  details?: Record<string, unknown>
): ToolResponse {
  const errorData = {
    success: false,
    error: message,
    ...(details && { details }),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(errorData, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Base handler function type
 *
 * All handlers should follow this signature pattern.
 */
export type Handler<Input> = (input: Input) => Promise<ToolResponse>;
