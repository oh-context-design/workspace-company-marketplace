/**
 * Linear API Key Manager
 *
 * Loads LINEAR_API_KEY from the global plugins .env file.
 * Single source of truth: ~/.claude/plugins/.env
 */

import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { config } from "dotenv";

// Global plugins .env location - single source of truth for all plugins
const GLOBAL_ENV_PATH = path.join(os.homedir(), ".claude", "plugins", ".env");

// Load from global location
config({ path: GLOBAL_ENV_PATH });

/**
 * Get the Linear API key from environment
 */
export function getApiKey(): string | null {
  const apiKey = process.env.LINEAR_API_KEY;
  if (apiKey && apiKey.startsWith("lin_api_")) {
    return apiKey;
  }
  return null;
}

/**
 * Check if API key is configured
 */
export function isConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * Get status information for display
 */
export function getStatus(): {
  configured: boolean;
  envPath: string;
  envExists: boolean;
} {
  return {
    configured: isConfigured(),
    envPath: GLOBAL_ENV_PATH,
    envExists: fs.existsSync(GLOBAL_ENV_PATH),
  };
}

/**
 * Validate that an API key has the correct format
 *
 * Linear API keys start with "lin_api_"
 */
export function validateApiKey(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false, error: "API key is required" };
  }

  const trimmed = apiKey.trim();

  if (!trimmed.startsWith("lin_api_")) {
    return {
      valid: false,
      error: 'Invalid API key format. Linear API keys start with "lin_api_"',
    };
  }

  if (trimmed.length < 20) {
    return { valid: false, error: "API key appears to be truncated" };
  }

  return { valid: true };
}

/**
 * Save API key to global .env file
 */
export function saveApiKey(apiKey: string): void {
  // Ensure directory exists
  const dir = path.dirname(GLOBAL_ENV_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  // Read existing content
  let content = "";
  if (fs.existsSync(GLOBAL_ENV_PATH)) {
    content = fs.readFileSync(GLOBAL_ENV_PATH, "utf-8");
  }

  // Update or append LINEAR_API_KEY
  if (content.includes("LINEAR_API_KEY=")) {
    content = content.replace(/LINEAR_API_KEY=.*/g, `LINEAR_API_KEY=${apiKey}`);
  } else {
    content += `\n# Linear API (for cycle management)\nLINEAR_API_KEY=${apiKey}\n`;
  }

  fs.writeFileSync(GLOBAL_ENV_PATH, content, { encoding: "utf-8", mode: 0o600 });
  // Reload into process.env
  process.env.LINEAR_API_KEY = apiKey;
}

/**
 * Remove the Linear API key from global .env
 */
export function removeApiKey(): boolean {
  if (!fs.existsSync(GLOBAL_ENV_PATH)) {
    return false;
  }

  let content = fs.readFileSync(GLOBAL_ENV_PATH, "utf-8");

  if (!content.includes("LINEAR_API_KEY=")) {
    return false;
  }

  // Remove the LINEAR_API_KEY line and its comment
  content = content.replace(/\n?# Linear API.*\nLINEAR_API_KEY=.*/g, "");
  content = content.replace(/LINEAR_API_KEY=.*/g, "");

  fs.writeFileSync(GLOBAL_ENV_PATH, content, { encoding: "utf-8", mode: 0o600 });
  delete process.env.LINEAR_API_KEY;

  return true;
}
