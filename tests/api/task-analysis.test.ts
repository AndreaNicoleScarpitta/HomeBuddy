/**
 * AI Task Analysis — Validation Tests
 *
 * Tests the input validation and response normalization logic
 * for the POST /v2/tasks/analyze endpoint. These are unit-level
 * tests that validate the sanitization and constraint logic
 * without calling OpenAI.
 */

import { describe, it, expect } from "vitest";

const validUrgencies = ["now", "soon", "later", "monitor"];
const validDiy = ["DIY-Safe", "Caution", "Pro-Only"];

/**
 * Extracted from routes_v2.ts response normalization logic.
 * Ensures AI output is constrained to valid enum values.
 */
function normalizeAnalysisResponse(parsed: Record<string, unknown>) {
  return {
    urgency: validUrgencies.includes(parsed.urgency as string) ? parsed.urgency : "later",
    diyLevel: validDiy.includes(parsed.diyLevel as string) ? parsed.diyLevel : "Caution",
    estimatedCost: (parsed.estimatedCost as string) || "TBD",
    description: (parsed.description as string) || "",
    safetyWarning: (parsed.safetyWarning as string) || null,
  };
}

describe("Task Analysis Response Normalization", () => {
  it("should accept valid urgency values", () => {
    for (const urgency of validUrgencies) {
      const result = normalizeAnalysisResponse({ urgency });
      expect(result.urgency).toBe(urgency);
    }
  });

  it("should default invalid urgency to 'later'", () => {
    const result = normalizeAnalysisResponse({ urgency: "ASAP" });
    expect(result.urgency).toBe("later");
  });

  it("should default missing urgency to 'later'", () => {
    const result = normalizeAnalysisResponse({});
    expect(result.urgency).toBe("later");
  });

  it("should accept valid DIY levels", () => {
    for (const diy of validDiy) {
      const result = normalizeAnalysisResponse({ diyLevel: diy });
      expect(result.diyLevel).toBe(diy);
    }
  });

  it("should default invalid DIY level to 'Caution'", () => {
    const result = normalizeAnalysisResponse({ diyLevel: "Easy" });
    expect(result.diyLevel).toBe("Caution");
  });

  it("should default missing estimatedCost to 'TBD'", () => {
    const result = normalizeAnalysisResponse({});
    expect(result.estimatedCost).toBe("TBD");
  });

  it("should pass through valid estimatedCost", () => {
    const result = normalizeAnalysisResponse({ estimatedCost: "$50-100" });
    expect(result.estimatedCost).toBe("$50-100");
  });

  it("should default missing description to empty string", () => {
    const result = normalizeAnalysisResponse({});
    expect(result.description).toBe("");
  });

  it("should default missing safetyWarning to null", () => {
    const result = normalizeAnalysisResponse({});
    expect(result.safetyWarning).toBeNull();
  });

  it("should pass through safetyWarning when present", () => {
    const result = normalizeAnalysisResponse({ safetyWarning: "Wear gloves" });
    expect(result.safetyWarning).toBe("Wear gloves");
  });

  it("should handle a full valid response", () => {
    const result = normalizeAnalysisResponse({
      urgency: "now",
      diyLevel: "Pro-Only",
      estimatedCost: "$200-500",
      description: "Repair the gas line",
      safetyWarning: "Natural gas hazard — call a licensed plumber",
    });

    expect(result.urgency).toBe("now");
    expect(result.diyLevel).toBe("Pro-Only");
    expect(result.estimatedCost).toBe("$200-500");
    expect(result.description).toBe("Repair the gas line");
    expect(result.safetyWarning).toBe("Natural gas hazard — call a licensed plumber");
  });
});

describe("Task Analysis Input Validation", () => {
  function validateTitle(title: unknown): { valid: boolean; error?: string } {
    if (!title || typeof title !== "string" || (title as string).trim().length < 3) {
      return { valid: false, error: "Task title is required (min 3 characters)" };
    }
    return { valid: true };
  }

  it("should reject empty title", () => {
    expect(validateTitle("")).toEqual({ valid: false, error: "Task title is required (min 3 characters)" });
  });

  it("should reject null title", () => {
    expect(validateTitle(null)).toEqual({ valid: false, error: "Task title is required (min 3 characters)" });
  });

  it("should reject title with less than 3 characters", () => {
    expect(validateTitle("ab")).toEqual({ valid: false, error: "Task title is required (min 3 characters)" });
  });

  it("should accept valid title", () => {
    expect(validateTitle("Fix the roof")).toEqual({ valid: true });
  });

  it("should reject whitespace-only title", () => {
    expect(validateTitle("  ")).toEqual({ valid: false, error: "Task title is required (min 3 characters)" });
  });
});
