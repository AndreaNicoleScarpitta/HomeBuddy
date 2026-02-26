/**
 * Contractor Mode — Preference Logic Tests
 *
 * Tests the contractor mode toggle behavior:
 * - When OFF, DIY level overrides should not be available
 * - When ON, DIY level overrides should be available
 * - The preference value should persist correctly
 */

import { describe, it, expect } from "vitest";

interface NotificationPreferences {
  emailDigest?: boolean;
  pushEnabled?: boolean;
  contractorMode?: boolean;
}

/**
 * Simulates reading contractor mode from notification preferences.
 * Mirrors the client-side logic in dashboard.tsx and profile.tsx.
 */
function getContractorMode(prefs: NotificationPreferences | null | undefined): boolean {
  return (prefs as any)?.contractorMode ?? false;
}

/**
 * Determines whether the DIY override UI should be visible.
 * Mirrors the conditional rendering in QuickAddTaskDialog.
 */
function shouldShowDiyOverride(contractorMode: boolean, hasAnalysisResult: boolean): boolean {
  return contractorMode && hasAnalysisResult;
}

describe("Contractor Mode Logic", () => {
  it("should default to false when preferences are null", () => {
    expect(getContractorMode(null)).toBe(false);
  });

  it("should default to false when preferences are undefined", () => {
    expect(getContractorMode(undefined)).toBe(false);
  });

  it("should default to false when contractorMode is not set", () => {
    expect(getContractorMode({ emailDigest: true })).toBe(false);
  });

  it("should return true when contractorMode is enabled", () => {
    expect(getContractorMode({ contractorMode: true })).toBe(true);
  });

  it("should return false when contractorMode is explicitly disabled", () => {
    expect(getContractorMode({ contractorMode: false })).toBe(false);
  });
});

describe("DIY Override Visibility", () => {
  it("should not show override when contractor mode is OFF", () => {
    expect(shouldShowDiyOverride(false, true)).toBe(false);
  });

  it("should not show override when no analysis result exists", () => {
    expect(shouldShowDiyOverride(true, false)).toBe(false);
  });

  it("should show override when contractor mode is ON and analysis exists", () => {
    expect(shouldShowDiyOverride(true, true)).toBe(true);
  });

  it("should not show override when both are false", () => {
    expect(shouldShowDiyOverride(false, false)).toBe(false);
  });
});

describe("Completion Provider Logic", () => {
  /**
   * Mirrors the AddLogEntryDialog provider assignment logic.
   * When user selects "myself", provider is set to "DIY (Myself)".
   * When user selects "contractor", provider uses the entered name or defaults to "Contractor".
   */
  function resolveProvider(completedBy: "myself" | "contractor", providerName: string): string {
    return completedBy === "contractor" ? (providerName || "Contractor") : "DIY (Myself)";
  }

  it("should return 'DIY (Myself)' when completed by myself", () => {
    expect(resolveProvider("myself", "")).toBe("DIY (Myself)");
  });

  it("should return contractor name when provided", () => {
    expect(resolveProvider("contractor", "ABC Plumbing")).toBe("ABC Plumbing");
  });

  it("should default to 'Contractor' when no name provided", () => {
    expect(resolveProvider("contractor", "")).toBe("Contractor");
  });

  it("should ignore provider name when completed by myself", () => {
    expect(resolveProvider("myself", "Some Company")).toBe("DIY (Myself)");
  });
});
