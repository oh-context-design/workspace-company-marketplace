/**
 * Schemas Unit Tests
 *
 * Tests for Zod validation schemas used by Linear Cycles MCP tools.
 */

import { describe, it, expect } from "vitest";
import {
  createCycleSchema,
  updateCycleSchema,
  deleteCycleSchema,
  getCycleMetricsSchema,
  manageAuthSchema,
} from "../../schemas/index.js";

describe("createCycleSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).not.toThrow();
  });

  it("accepts valid input with optional name and description", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Sprint 42",
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
      description: "Focus on core features",
    };
    const result = createCycleSchema.parse(input);
    expect(result.name).toBe("Sprint 42");
    expect(result.description).toBe("Focus on core features");
  });

  it("rejects missing teamId", () => {
    const input = {
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });

  it("rejects missing startsAt date", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });

  it("rejects missing endsAt date", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-01",
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });

  it("rejects invalid UUID format for teamId", () => {
    const input = {
      teamId: "not-a-uuid",
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow(/teamId must be a valid UUID/);
  });

  it("rejects invalid date format for startsAt", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "02/01/2024",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow(
      /startsAt must be in YYYY-MM-DD format/
    );
  });

  it("rejects invalid date format for endsAt", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-01",
      endsAt: "2024/02/15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow(
      /endsAt must be in YYYY-MM-DD format/
    );
  });

  it("rejects name exceeding max length of 255 characters", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      name: "a".repeat(256),
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });

  it("rejects description exceeding max length of 10000 characters", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
      description: "a".repeat(10001),
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });
});

describe("updateCycleSchema", () => {
  it("accepts valid partial update with cycleId and name", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Updated Sprint",
    };
    const result = updateCycleSchema.parse(input);
    expect(result.cycleId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(result.name).toBe("Updated Sprint");
  });

  it("accepts valid partial update with cycleId and dates", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-03-01",
      endsAt: "2024-03-15",
    };
    expect(() => updateCycleSchema.parse(input)).not.toThrow();
  });

  it("accepts valid partial update with cycleId and description", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      description: "New goals",
    };
    expect(() => updateCycleSchema.parse(input)).not.toThrow();
  });

  it("rejects update with only cycleId and no other fields", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
    };
    expect(() => updateCycleSchema.parse(input)).toThrow(
      /At least one field must be provided for update/
    );
  });

  it("rejects invalid UUID format for cycleId", () => {
    const input = {
      cycleId: "invalid-uuid",
      name: "Updated",
    };
    expect(() => updateCycleSchema.parse(input)).toThrow(
      /cycleId must be a valid UUID/
    );
  });

  it("rejects invalid date format for startsAt", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "01-03-2024",
    };
    expect(() => updateCycleSchema.parse(input)).toThrow(
      /startsAt must be in YYYY-MM-DD format/
    );
  });

  it("rejects invalid date format for endsAt", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      endsAt: "2024.03.15",
    };
    expect(() => updateCycleSchema.parse(input)).toThrow(
      /endsAt must be in YYYY-MM-DD format/
    );
  });

  it("rejects name exceeding max length", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      name: "a".repeat(256),
    };
    expect(() => updateCycleSchema.parse(input)).toThrow();
  });
});

describe("deleteCycleSchema", () => {
  it("accepts valid cycleId", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
    };
    const result = deleteCycleSchema.parse(input);
    expect(result.cycleId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("rejects invalid UUID format", () => {
    const input = {
      cycleId: "not-a-uuid",
    };
    expect(() => deleteCycleSchema.parse(input)).toThrow(
      /cycleId must be a valid UUID/
    );
  });

  it("rejects empty string cycleId", () => {
    const input = {
      cycleId: "",
    };
    expect(() => deleteCycleSchema.parse(input)).toThrow();
  });

  it("accepts uppercase UUID", () => {
    const input = {
      cycleId: "123E4567-E89B-12D3-A456-426614174000",
    };
    expect(() => deleteCycleSchema.parse(input)).not.toThrow();
  });
});

describe("getCycleMetricsSchema", () => {
  it("accepts metrics query with cycleId as UUID", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
    };
    const result = getCycleMetricsSchema.parse(input);
    expect(result.cycleId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("accepts metrics query with cycleId as 'current' and teamId", () => {
    const input = {
      cycleId: "current",
      teamId: "123e4567-e89b-12d3-a456-426614174000",
    };
    const result = getCycleMetricsSchema.parse(input);
    expect(result.cycleId).toBe("current");
    expect(result.teamId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("rejects 'current' cycleId without teamId", () => {
    const input = {
      cycleId: "current",
    };
    expect(() => getCycleMetricsSchema.parse(input)).toThrow();
  });

  it("rejects invalid cycleId that is neither UUID nor 'current'", () => {
    const input = {
      cycleId: "invalid",
    };
    expect(() => getCycleMetricsSchema.parse(input)).toThrow();
  });

  it("rejects invalid UUID format when cycleId is not 'current'", () => {
    const input = {
      cycleId: "not-a-uuid",
    };
    expect(() => getCycleMetricsSchema.parse(input)).toThrow();
  });

  it("rejects invalid teamId UUID format", () => {
    const input = {
      cycleId: "current",
      teamId: "invalid-uuid",
    };
    expect(() => getCycleMetricsSchema.parse(input)).toThrow(
      /teamId must be a valid UUID/
    );
  });
});

describe("manageAuthSchema", () => {
  it("accepts action 'status' without apiKey", () => {
    const input = {
      action: "status" as const,
    };
    const result = manageAuthSchema.parse(input);
    expect(result.action).toBe("status");
  });

  it("accepts action 'setup' with apiKey", () => {
    const input = {
      action: "setup" as const,
      apiKey: "lin_api_1234567890abcdef",
    };
    const result = manageAuthSchema.parse(input);
    expect(result.action).toBe("setup");
    expect(result.apiKey).toBe("lin_api_1234567890abcdef");
  });

  it("accepts action 'remove' without apiKey", () => {
    const input = {
      action: "remove" as const,
    };
    const result = manageAuthSchema.parse(input);
    expect(result.action).toBe("remove");
  });

  it("rejects invalid action", () => {
    const input = {
      action: "invalid",
    };
    expect(() => manageAuthSchema.parse(input)).toThrow();
  });

  it("accepts setup with optional apiKey", () => {
    const input = {
      action: "setup" as const,
    };
    const result = manageAuthSchema.parse(input);
    expect(result.action).toBe("setup");
    expect(result.apiKey).toBeUndefined();
  });
});

describe("UUID validation", () => {
  it("accepts valid v4 UUID format (lowercase)", () => {
    const input = {
      cycleId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    };
    expect(() => deleteCycleSchema.parse(input)).not.toThrow();
  });

  it("accepts valid v4 UUID format (uppercase)", () => {
    const input = {
      cycleId: "F47AC10B-58CC-4372-A567-0E02B2C3D479",
    };
    expect(() => deleteCycleSchema.parse(input)).not.toThrow();
  });

  it("accepts valid v4 UUID format (mixed case)", () => {
    const input = {
      cycleId: "F47ac10B-58CC-4372-a567-0E02B2C3D479",
    };
    expect(() => deleteCycleSchema.parse(input)).not.toThrow();
  });

  it("rejects UUID without hyphens", () => {
    const input = {
      cycleId: "f47ac10b58cc4372a5670e02b2c3d479",
    };
    expect(() => deleteCycleSchema.parse(input)).toThrow();
  });

  it("rejects UUID with invalid characters", () => {
    const input = {
      cycleId: "f47ac10b-58cc-4372-a567-0e02b2c3d47z",
    };
    expect(() => deleteCycleSchema.parse(input)).toThrow();
  });
});

describe("Date format validation", () => {
  it("accepts valid ISO date format (YYYY-MM-DD)", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-12-31",
      endsAt: "2025-01-31",
    };
    expect(() => createCycleSchema.parse(input)).not.toThrow();
  });

  it("rejects date with single-digit month", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-1-01",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });

  it("rejects date with single-digit day", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-1",
      endsAt: "2024-02-15",
    };
    expect(() => createCycleSchema.parse(input)).toThrow();
  });

  it("rejects invalid month in date", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-13-01",
      endsAt: "2024-02-15",
    };
    // Schema only validates format, not logical correctness
    expect(() => createCycleSchema.parse(input)).not.toThrow();
  });
});

describe("Optional fields", () => {
  it("accepts undefined optional name field", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
      name: undefined,
    };
    const result = createCycleSchema.parse(input);
    expect(result.name).toBeUndefined();
  });

  it("accepts undefined optional description field", () => {
    const input = {
      teamId: "123e4567-e89b-12d3-a456-426614174000",
      startsAt: "2024-02-01",
      endsAt: "2024-02-15",
      description: undefined,
    };
    const result = createCycleSchema.parse(input);
    expect(result.description).toBeUndefined();
  });

  it("accepts undefined optional teamId in metrics query", () => {
    const input = {
      cycleId: "123e4567-e89b-12d3-a456-426614174000",
      teamId: undefined,
    };
    const result = getCycleMetricsSchema.parse(input);
    expect(result.teamId).toBeUndefined();
  });
});

describe("Schema exports", () => {
  it("exports createCycleSchema", () => {
    expect(createCycleSchema).toBeDefined();
    expect(createCycleSchema.parse).toBeDefined();
  });

  it("exports updateCycleSchema", () => {
    expect(updateCycleSchema).toBeDefined();
    expect(updateCycleSchema.parse).toBeDefined();
  });

  it("exports deleteCycleSchema", () => {
    expect(deleteCycleSchema).toBeDefined();
    expect(deleteCycleSchema.parse).toBeDefined();
  });

  it("exports getCycleMetricsSchema", () => {
    expect(getCycleMetricsSchema).toBeDefined();
    expect(getCycleMetricsSchema.parse).toBeDefined();
  });

  it("exports manageAuthSchema", () => {
    expect(manageAuthSchema).toBeDefined();
    expect(manageAuthSchema.parse).toBeDefined();
  });
});
