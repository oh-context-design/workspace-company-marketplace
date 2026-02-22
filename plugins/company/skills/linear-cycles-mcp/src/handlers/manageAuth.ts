/**
 * Manage Auth Handler
 *
 * First-Time User Experience (FTUE) tool for Linear API key management.
 * Provides status, setup, and remove operations.
 *
 * API key is stored in .env file in the plugin directory.
 */

import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  getStatus,
  saveApiKey,
  removeApiKey,
  validateApiKey,
} from "../auth/keyManager.js";
import { resetLinearClient } from "../client/linear.js";

/**
 * Schema for manage_auth tool
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
    .describe("Linear API key (required for 'setup' action). Get one from Linear Settings > API."),
});

export type ManageAuthInput = z.infer<typeof manageAuthSchema>;

/**
 * Handle the manage_auth tool
 */
export async function handleManageAuth(input: ManageAuthInput): Promise<CallToolResult> {
  switch (input.action) {
    case "status":
      return handleStatus();
    case "setup":
      return handleSetup(input.apiKey);
    case "remove":
      return handleRemove();
    default:
      return {
        content: [
          {
            type: "text",
            text: `Unknown action: ${input.action}. Use 'status', 'setup', or 'remove'.`,
          },
        ],
        isError: true,
      };
  }
}

/**
 * Show current authentication status
 */
function handleStatus(): CallToolResult {
  const status = getStatus();

  if (status.configured) {
    return {
      content: [
        {
          type: "text",
          text: `✓ Linear API key is configured

Source: ${status.envPath}

All Linear Cycles MCP tools are ready to use.`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `✗ Linear API key is not configured

To get started:

1. Go to Linear Settings > API > Personal API keys
   https://linear.app/settings/api

2. Create a new API key with appropriate permissions

3. Run: manage_auth with action: "setup" and apiKey: "lin_api_..."

Or create .env file at: ${status.envPath}
With contents: LINEAR_API_KEY=lin_api_...`,
      },
    ],
  };
}

/**
 * Store a new API key
 */
function handleSetup(apiKey: string | undefined): CallToolResult {
  if (!apiKey) {
    return {
      content: [
        {
          type: "text",
          text: `Error: API key is required for setup action.

Usage:
  action: "setup"
  apiKey: "lin_api_your_key_here"

Get your API key from: https://linear.app/settings/api`,
        },
      ],
      isError: true,
    };
  }

  // Validate the key format
  const validation = validateApiKey(apiKey);
  if (!validation.valid) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${validation.error}

Linear API keys look like: lin_api_xxxxxxxxxxxxxxxxxxxxxxxx

Get your API key from: https://linear.app/settings/api`,
        },
      ],
      isError: true,
    };
  }

  try {
    saveApiKey(apiKey.trim());
    resetLinearClient(); // Invalidate cached client so it picks up new key

    const status = getStatus();

    return {
      content: [
        {
          type: "text",
          text: `✓ Linear API key configured successfully

Saved to: ${status.envPath}

All Linear Cycles MCP tools are now ready to use.

Try running: get_cycle_metrics with cycleId: "current"`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error storing API key: ${message}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Remove the stored API key
 */
function handleRemove(): CallToolResult {
  const status = getStatus();

  if (!status.configured) {
    return {
      content: [
        {
          type: "text",
          text: `No API key is currently stored.`,
        },
      ],
    };
  }

  try {
    const removed = removeApiKey();

    if (removed) {
      return {
        content: [
          {
            type: "text",
            text: `✓ API key removed successfully

Deleted: ${status.envPath}

To reconfigure, run: manage_auth with action: "setup"`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `No .env file found at: ${status.envPath}`,
          },
        ],
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error removing API key: ${message}`,
        },
      ],
      isError: true,
    };
  }
}
