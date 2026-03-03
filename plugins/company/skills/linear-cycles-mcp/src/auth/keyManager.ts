/**
 * Linear API Key Manager
 *
 * Reads and writes credentials via OS Keychain only.
 * macOS: Keychain Access  |  Linux: libsecret
 */

import * as path from "path";
import * as os from "os";
import { execFileSync } from "child_process";

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the Linear API key from OS keychain.
 */
export function getApiKey(): string | null {
  try {
    const keychainKey = keychainLoad();
    if (keychainKey && keychainKey.startsWith("lin_api_")) {
      return keychainKey;
    }
  } catch {
    // Keychain unavailable
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
  source: "keychain" | "none";
} {
  try {
    const keychainKey = keychainLoad();
    if (keychainKey && keychainKey.startsWith("lin_api_")) {
      return { configured: true, source: "keychain" };
    }
  } catch {
    // Keychain unavailable
  }

  return { configured: false, source: "none" };
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
 * Save API key to OS keychain.
 */
export function saveApiKey(apiKey: string): void {
  keychainStore(apiKey);
}

/**
 * Remove the Linear API key from keychain.
 */
export function removeApiKey(): boolean {
  try {
    return keychainDelete();
  } catch {
    return false;
  }
}
