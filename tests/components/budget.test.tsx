import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

describe("Currency Formatting", () => {
  it("should format cents to dollars", () => {
    expect(formatCurrency(10000)).toBe("$100");
    expect(formatCurrency(150000)).toBe("$1,500");
  });

  it("should handle zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("Affordability Calculation", () => {
  const calculateAffordability = (available: number, cost: number) => {
    if (cost === 0) return "unknown";
    const percentage = (available / cost) * 100;
    if (percentage >= 100) return "can_afford";
    if (percentage >= 50) return "almost_there";
    return "may_wait";
  };

  it("should identify affordable items", () => {
    expect(calculateAffordability(5000, 3000)).toBe("can_afford");
  });

  it("should identify almost affordable items", () => {
    expect(calculateAffordability(3000, 5000)).toBe("almost_there");
  });

  it("should identify items that may need to wait", () => {
    expect(calculateAffordability(1000, 5000)).toBe("may_wait");
  });
});

describe("Fund Type Classification", () => {
  const getFundTypeLabel = (type: string | null) => {
    switch (type) {
      case "emergency":
        return "Emergency Only";
      case "dedicated":
        return "Dedicated";
      default:
        return "General";
    }
  };

  it("should label emergency funds", () => {
    expect(getFundTypeLabel("emergency")).toBe("Emergency Only");
  });

  it("should label general funds by default", () => {
    expect(getFundTypeLabel(null)).toBe("General");
  });
});
