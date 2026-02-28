/**
 * Base Handler Tests
 *
 * Tests for base handler utilities and response formatting.
 */

import { describe, it, expect } from "vitest";
import {
  createSuccessResponse,
  createErrorResponse,
  type TToolResponse,
} from "../../../handlers/base.js";

describe("createSuccessResponse", () => {
  it("creates response with correct structure", () => {
    const data = { success: true, id: "123" };
    const response = createSuccessResponse(data);

    expect(response).toHaveProperty("content");
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBe(1);
  });

  it("contains text type in content", () => {
    const data = { message: "test" };
    const response = createSuccessResponse(data);

    expect(response.content[0].type).toBe("text");
    expect(typeof response.content[0].text).toBe("string");
  });

  it("serializes data as JSON string", () => {
    const data = { count: 42, items: ["a", "b"] };
    const response = createSuccessResponse(data);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.count).toBe(42);
    expect(parsed.items).toEqual(["a", "b"]);
  });

  it("handles nested objects correctly", () => {
    const data = {
      cycle: {
        id: "cycle-1",
        name: "Sprint 1",
        dates: {
          start: "2024-01-01",
          end: "2024-01-15",
        },
      },
    };
    const response = createSuccessResponse(data);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.cycle.dates.start).toBe("2024-01-01");
  });

  it("does not set isError flag", () => {
    const data = { success: true };
    const response = createSuccessResponse(data);

    expect(response.isError).toBeUndefined();
  });

  it("formats JSON with indentation", () => {
    const data = { key: "value" };
    const response = createSuccessResponse(data);
    const text = response.content[0].text;

    // Should contain newlines and spaces (formatted)
    expect(text).toContain("\n");
  });
});

describe("createErrorResponse", () => {
  it("creates error response with correct structure", () => {
    const response = createErrorResponse("Something went wrong");

    expect(response).toHaveProperty("content");
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBe(1);
  });

  it("sets isError flag to true", () => {
    const response = createErrorResponse("Error occurred");

    expect(response.isError).toBe(true);
  });

  it("contains text type in content", () => {
    const response = createErrorResponse("Test error");

    expect(response.content[0].type).toBe("text");
    expect(typeof response.content[0].text).toBe("string");
  });

  it("includes error message in serialized JSON", () => {
    const response = createErrorResponse("Custom error message");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.error).toBe("Custom error message");
  });

  it("sets success to false", () => {
    const response = createErrorResponse("Failed");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.success).toBe(false);
  });

  it("includes details object when provided", () => {
    const details = { cycleId: "123", fieldName: "name" };
    const response = createErrorResponse("Update failed", details);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.details).toEqual(details);
    expect(parsed.details.cycleId).toBe("123");
  });

  it("excludes details when not provided", () => {
    const response = createErrorResponse("Error without details");

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.details).toBeUndefined();
  });

  it("handles complex details objects", () => {
    const details = {
      attempted: ["field1", "field2"],
      metadata: {
        timestamp: "2024-01-01",
        code: "ERR_001",
      },
    };
    const response = createErrorResponse("Complex error", details);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.details.attempted).toEqual(["field1", "field2"]);
    expect(parsed.details.metadata.code).toBe("ERR_001");
  });

  it("formats JSON with indentation", () => {
    const response = createErrorResponse("Formatted error");
    const text = response.content[0].text;

    // Should contain newlines and spaces (formatted)
    expect(text).toContain("\n");
  });
});

describe("Response interface compliance", () => {
  it("success response conforms to TToolResponse", () => {
    const response = createSuccessResponse({ data: "test" });

    // Should have content array
    expect(Array.isArray(response.content)).toBe(true);

    // Each content item should have type and text
    response.content.forEach((item) => {
      expect(item.type).toBe("text");
      expect(typeof item.text).toBe("string");
    });

    // isError should be optional and valid
    if (response.isError !== undefined) {
      expect(typeof response.isError).toBe("boolean");
    }
  });

  it("error response conforms to TToolResponse", () => {
    const response = createErrorResponse("Test error", { code: "ERR_001" });

    // Should have content array
    expect(Array.isArray(response.content)).toBe(true);

    // Each content item should have type and text
    response.content.forEach((item) => {
      expect(item.type).toBe("text");
      expect(typeof item.text).toBe("string");
    });

    // isError should be set to true
    expect(response.isError).toBe(true);
  });
});

describe("Response serialization", () => {
  it("produces valid JSON in success response", () => {
    const data = { id: "test-123", value: 42 };
    const response = createSuccessResponse(data);

    // Should not throw when parsing
    expect(() => {
      JSON.parse(response.content[0].text);
    }).not.toThrow();
  });

  it("produces valid JSON in error response", () => {
    const response = createErrorResponse("Test error", { code: "TEST" });

    // Should not throw when parsing
    expect(() => {
      JSON.parse(response.content[0].text);
    }).not.toThrow();
  });

  it("preserves special characters in JSON serialization", () => {
    const data = { message: 'Quote "test" with \\ backslash' };
    const response = createSuccessResponse(data);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.message).toBe('Quote "test" with \\ backslash');
  });

  it("handles null values in details", () => {
    const details = { value: null, other: "data" };
    const response = createErrorResponse("Error", details);

    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.details.value).toBeNull();
    expect(parsed.details.other).toBe("data");
  });

  it("handles empty objects", () => {
    const response = createSuccessResponse({});

    const parsed = JSON.parse(response.content[0].text);
    expect(typeof parsed).toBe("object");
  });

  it("handles arrays of objects", () => {
    const data = {
      cycles: [
        { id: "1", name: "Sprint 1" },
        { id: "2", name: "Sprint 2" },
      ],
    };
    const response = createSuccessResponse(data);

    const parsed = JSON.parse(response.content[0].text);
    expect(Array.isArray(parsed.cycles)).toBe(true);
    expect(parsed.cycles.length).toBe(2);
    expect(parsed.cycles[0].name).toBe("Sprint 1");
  });
});
