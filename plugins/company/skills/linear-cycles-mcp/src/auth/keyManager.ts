/**
 * Linear API Key Manager
 *
 * Priority: OS Keychain > ~/.claude/plugins/.env (backward compatibility)
 *
 * Reads from keychain first, falls back to .env.
 * Writes always go to keychain.
 */

import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { execFileSync } from "child_process";
import { config } from "dotenv";

// ---------------------------------------------------------------------------
// Keychain helpers (minimal, same pattern as calendar MCP's keychain.ts)
// ---------------------------------------------------------------------------

const KEYCHAIN_ACCOUNT = "ohcontext-local";
const KEYCHAIN_SERVICE = "ohcontext-linear-api-key";

function getVerifiedPlatform(): "darwin" | "linux" {
  const p = os.platform();
  if (p === "darwin") return "darwin";
  if (p === "linux") return "linux";
  throw new Error(
    `Unsupported platform "${p}" for keychain storage.\n\n` +
      `This plugin requires OS-level keychain for secure credential storage:\n` +
      `  - macOS: Keychain Access (built-in)\n` +
      `  - Linux: libsecret (install: sudo apt install libsecret-tools)\n\n` +
      `Your platform "${p}" is not supported. Please use macOS or Linux.`
  );
}

function keychainStore(value: string): void {
  const p = getVerifiedPlatform();

  if (p === "darwin") {
    const keychainPath = path.join(
      os.homedir(),
      "Library",
      "Keychains",
      "login.keychain-db"
    );
    execFileSync(
      "security",
      [
        "add-generic-password",
        "-a",
        KEYCHAIN_ACCOUNT,
        "-s",
        KEYCHAIN_SERVICE,
        "-w",
        value,
        "-U",
        keychainPath,
      ],
      { stdio: "pipe" }
    );
  } else {
    execFileSync(
      "secret-tool",
      [
        "store",
        "--label",
        KEYCHAIN_SERVICE,
        "account",
        KEYCHAIN_ACCOUNT,
        "service",
        KEYCHAIN_SERVICE,
      ],
      { input: value, stdio: ["pipe", "pipe", "pipe"] }
    );
  }
}

function keychainLoad(): string | null {
  const p = getVerifiedPlatform();

  try {
    if (p === "darwin") {
      const keychainPath = path.join(
        os.homedir(),
        "Library",
        "Keychains",
        "login.keychain-db"
      );
      const result = execFileSync(
        "security",
        [
          "find-generic-password",
          "-a",
          KEYCHAIN_ACCOUNT,
          "-s",
          KEYCHAIN_SERVICE,
          "-w",
          keychainPath,
        ],
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      return result.trim() || null;
    } else {
      const result = execFileSync(
        "secret-tool",
        ["lookup", "account", KEYCHAIN_ACCOUNT, "service", KEYCHAIN_SERVICE],
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      return result.trim() || null;
    }
  } catch {
    return null;
  }
}

function keychainDelete(): boolean {
  const p = getVerifiedPlatform();

  try {
    if (p === "darwin") {
      const keychainPath = path.join(
        os.homedir(),
        "Library",
        "Keychains",
        "login.keychain-db"
      );
      execFileSync(
        "security",
        [
          "delete-generic-password",
          "-a",
          KEYCHAIN_ACCOUNT,
          "-s",
          KEYCHAIN_SERVICE,
          keychainPath,
        ],
        { stdio: "pipe" }
      );
    } else {
      execFileSync(
        "secret-tool",
        ["clear", "account", KEYCHAIN_ACCOUNT, "service", KEYCHAIN_SERVICE],
        { stdio: "pipe" }
      );
    }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// .env fallback (backward compatibility)
// ---------------------------------------------------------------------------

// Global plugins .env location - fallback for backward compatibility
const GLOBAL_ENV_PATH = path.join(os.homedir(), ".claude", "plugins", ".env");

// Load from global location so process.env.LINEAR_API_KEY is populated
config({ path: GLOBAL_ENV_PATH });

// ---------------------------------------------------------------------------
// Public API (same signatures as before)
// ---------------------------------------------------------------------------

/**
 * Get the Linear API key.
 * Priority: keychain > process.env (loaded from .env)
 */
export function getApiKey(): string | null {
  // Priority 1: OS Keychain
  try {
    const keychainKey = keychainLoad();
    if (keychainKey && keychainKey.startsWith("lin_api_")) {
      // Keep process.env in sync so downstream code that reads it directly works
      process.env.LINEAR_API_KEY = keychainKey;
      return keychainKey;
    }
  } catch {
    // Keychain unavailable — fall through to .env
  }

  // Priority 2: .env / process.env fallback
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
  source: "keychain" | "env" | "none";
  envPath: string;
  envExists: boolean;
} {
  // Check keychain first
  try {
    const keychainKey = keychainLoad();
    if (keychainKey && keychainKey.startsWith("lin_api_")) {
      return {
        configured: true,
        source: "keychain",
        envPath: GLOBAL_ENV_PATH,
        envExists: fs.existsSync(GLOBAL_ENV_PATH),
      };
    }
  } catch {
    // Keychain unavailable
  }

  // Check .env
  const envKey = process.env.LINEAR_API_KEY;
  if (envKey && envKey.startsWith("lin_api_")) {
    return {
      configured: true,
      source: "env",
      envPath: GLOBAL_ENV_PATH,
      envExists: fs.existsSync(GLOBAL_ENV_PATH),
    };
  }

  return {
    configured: false,
    source: "none",
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
 * Save API key to OS keychain (primary) and update process.env.
 */
export function saveApiKey(apiKey: string): void {
  // Store in keychain
  keychainStore(apiKey);

  // Reload into process.env so the running process picks it up immediately
  process.env.LINEAR_API_KEY = apiKey;
}

/**
 * Remove the Linear API key from keychain and .env
 */
export function removeApiKey(): boolean {
  let removed = false;

  // Remove from keychain
  try {
    if (keychainDelete()) {
      removed = true;
    }
  } catch {
    // Keychain unavailable — continue to .env cleanup
  }

  // Also clean up .env for completeness
  if (fs.existsSync(GLOBAL_ENV_PATH)) {
    let content = fs.readFileSync(GLOBAL_ENV_PATH, "utf-8");

    if (content.includes("LINEAR_API_KEY=")) {
      // Remove the LINEAR_API_KEY line and its comment
      content = content.replace(/\n?# Linear API.*\nLINEAR_API_KEY=.*/g, "");
      content = content.replace(/LINEAR_API_KEY=.*/g, "");

      fs.writeFileSync(GLOBAL_ENV_PATH, content, {
        encoding: "utf-8",
        mode: 0o600,
      });
      removed = true;
    }
  }

  delete process.env.LINEAR_API_KEY;

  return removed;
}
