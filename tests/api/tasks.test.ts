import { describe, it, expect } from "vitest";

describe("Task Urgency Calculation", () => {
  const getUrgencyOrder = (urgency: string) => {
    const order: Record<string, number> = { now: 0, soon: 1, later: 2, monitor: 3 };
    return order[urgency] ?? 4;
  };

  it("should prioritize 'now' tasks first", () => {
    expect(getUrgencyOrder("now")).toBe(0);
  });

  it("should order urgencies correctly", () => {
    const tasks = [
      { urgency: "later" },
      { urgency: "now" },
      { urgency: "soon" },
    ];
    
    const sorted = [...tasks].sort(
      (a, b) => getUrgencyOrder(a.urgency) - getUrgencyOrder(b.urgency)
    );
    
    expect(sorted[0].urgency).toBe("now");
    expect(sorted[1].urgency).toBe("soon");
    expect(sorted[2].urgency).toBe("later");
  });
});

describe("DIY Level Assessment", () => {
  const getDiyDifficulty = (level: string) => {
    const levels: Record<string, number> = {
      "DIY - Easy": 1,
      "DIY - Moderate": 2,
      "DIY - Advanced": 3,
      "Call a Pro": 4,
    };
    return levels[level] ?? 0;
  };

  it("should identify easy DIY tasks", () => {
    expect(getDiyDifficulty("DIY - Easy")).toBe(1);
  });

  it("should identify pro-required tasks", () => {
    expect(getDiyDifficulty("Call a Pro")).toBe(4);
  });
});

describe("Cost Parsing", () => {
  const parseCost = (cost: string | null): number => {
    if (!cost) return 0;
    const match = cost.replace(/[^0-9.-]/g, "");
    return parseFloat(match) * 100 || 0;
  };

  it("should parse dollar amounts correctly", () => {
    expect(parseCost("$150")).toBe(15000);
    expect(parseCost("$1,500")).toBe(150000);
  });

  it("should handle null costs", () => {
    expect(parseCost(null)).toBe(0);
  });
});
