/**
 * Maintenance Log — Task Categorization Tests
 *
 * Tests the categorizeTasks logic that sorts tasks into four buckets:
 * upcoming, due, past_due, and completed. This is the core filtering
 * logic for the Maintenance Log page.
 */

import { describe, it, expect } from "vitest";

interface MockTask {
  id: string;
  homeId: string;
  title: string;
  status: string;
  state: string;
  dueDate?: string | null;
  urgency?: string;
  category?: string | null;
  relatedSystemId?: string | null;
  diyLevel?: string | null;
  estimatedCost?: string | null;
  description?: string | null;
  actualCost?: number | null;
  difficulty?: string | null;
  safetyWarning?: string | null;
}

/**
 * Extracted from maintenance-log.tsx for testability.
 * Categorizes tasks into upcoming, due, past_due, and completed buckets.
 */
function categorizeTasks(tasks: MockTask[]) {
  const now = new Date();
  const upcoming: MockTask[] = [];
  const due: MockTask[] = [];
  const pastDue: MockTask[] = [];
  const completed: MockTask[] = [];

  for (const task of tasks) {
    if (task.status === "completed" || task.state === "completed") {
      completed.push(task);
      continue;
    }

    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    if (!dueDate) {
      upcoming.push(task);
      continue;
    }

    const isPast = dueDate < now && dueDate.toDateString() !== now.toDateString();
    const isToday = dueDate.toDateString() === now.toDateString();
    const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isFuture = dueDate > now;

    if (isPast && !isToday) {
      pastDue.push(task);
    } else if (isToday || (isFuture && diffDays <= 7)) {
      due.push(task);
    } else {
      upcoming.push(task);
    }
  }

  pastDue.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  due.sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDate - bDate;
  });
  upcoming.sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDate - bDate;
  });
  completed.sort((a, b) => {
    const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return bDate - aDate;
  });

  return { upcoming, due, past_due: pastDue, completed };
}

function makeTask(overrides: Partial<MockTask> = {}): MockTask {
  return {
    id: overrides.id || crypto.randomUUID(),
    homeId: "home-1",
    title: overrides.title || "Test Task",
    status: overrides.status || "pending",
    state: overrides.state || "active",
    dueDate: overrides.dueDate ?? null,
    urgency: overrides.urgency,
    category: overrides.category ?? null,
    relatedSystemId: null,
    diyLevel: null,
    estimatedCost: null,
    description: null,
    actualCost: null,
    difficulty: null,
    safetyWarning: null,
  };
}

describe("categorizeTasks", () => {
  it("should place completed tasks in the completed bucket", () => {
    const tasks = [
      makeTask({ title: "Done task", status: "completed" }),
      makeTask({ title: "Also done", state: "completed" }),
      makeTask({ title: "Pending task", status: "pending" }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.completed).toHaveLength(2);
    expect(result.completed.map(t => t.title)).toContain("Done task");
    expect(result.completed.map(t => t.title)).toContain("Also done");
  });

  it("should place tasks with no due date in upcoming", () => {
    const tasks = [
      makeTask({ title: "No date task", dueDate: null }),
      makeTask({ title: "Also no date", dueDate: undefined }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.upcoming).toHaveLength(2);
    expect(result.due).toHaveLength(0);
    expect(result.past_due).toHaveLength(0);
  });

  it("should place past-due tasks in the past_due bucket", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 3);

    const tasks = [
      makeTask({ title: "Overdue", dueDate: yesterday.toISOString() }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.past_due).toHaveLength(1);
    expect(result.past_due[0].title).toBe("Overdue");
  });

  it("should place tasks due today in the due bucket", () => {
    const today = new Date();
    today.setHours(23, 59, 59, 0);

    const tasks = [
      makeTask({ title: "Due today", dueDate: today.toISOString() }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.due).toHaveLength(1);
    expect(result.due[0].title).toBe("Due today");
  });

  it("should place tasks due within 7 days in the due bucket", () => {
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    const tasks = [
      makeTask({ title: "Soon", dueDate: inThreeDays.toISOString() }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.due).toHaveLength(1);
  });

  it("should place tasks due more than 7 days out in upcoming", () => {
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

    const tasks = [
      makeTask({ title: "Far out", dueDate: inTwoWeeks.toISOString() }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].title).toBe("Far out");
  });

  it("should sort past_due by date ascending (most overdue first)", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const tasks = [
      makeTask({ title: "3 days ago", dueDate: threeDaysAgo.toISOString() }),
      makeTask({ title: "5 days ago", dueDate: fiveDaysAgo.toISOString() }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.past_due[0].title).toBe("5 days ago");
    expect(result.past_due[1].title).toBe("3 days ago");
  });

  it("should sort completed by date descending (most recent first)", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1);
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);

    const tasks = [
      makeTask({ title: "Old done", status: "completed", dueDate: oldDate.toISOString() }),
      makeTask({ title: "Recent done", status: "completed", dueDate: recentDate.toISOString() }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.completed[0].title).toBe("Recent done");
    expect(result.completed[1].title).toBe("Old done");
  });

  it("should handle an empty task array", () => {
    const result = categorizeTasks([]);
    expect(result.upcoming).toHaveLength(0);
    expect(result.due).toHaveLength(0);
    expect(result.past_due).toHaveLength(0);
    expect(result.completed).toHaveLength(0);
  });

  it("should distribute mixed tasks into correct buckets", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 2);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    const tasks = [
      makeTask({ title: "Overdue", dueDate: pastDate.toISOString() }),
      makeTask({ title: "Soon", dueDate: soonDate.toISOString() }),
      makeTask({ title: "Future", dueDate: futureDate.toISOString() }),
      makeTask({ title: "No date" }),
      makeTask({ title: "Done", status: "completed" }),
    ];

    const result = categorizeTasks(tasks);
    expect(result.past_due).toHaveLength(1);
    expect(result.due).toHaveLength(1);
    expect(result.upcoming).toHaveLength(2);
    expect(result.completed).toHaveLength(1);
  });
});
