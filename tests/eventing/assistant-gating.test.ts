/**
 * Assistant Gating Tests — Milestone 4
 *
 * Verifies the propose → approve → execute lifecycle:
 *   - Cannot execute without explicit approval (409)
 *   - Propose stores provenance/confidence metadata
 *   - Approve + execute creates downstream domain events
 *   - Reject prevents subsequent approval
 *   - GET endpoints return action details and list by homeId
 *   - Full audit trail via event stream
 */

import { describe, it, expect, beforeAll } from "vitest";
import { Pool } from "pg";

const TEST_PORT = Number(process.env.PORT ?? 5000);
const BASE = `http://localhost:${TEST_PORT}/v2`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

interface V2Response {
  status: number;
  data: Record<string, unknown>;
}

async function v2(
  method: string,
  path: string,
  body: Record<string, unknown> = {},
  idempotencyKey: string = crypto.randomUUID(),
): Promise<V2Response> {
  const opts: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  };
  if (method !== "GET") {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

async function v2Get(path: string): Promise<V2Response> {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  const data = await res.json();
  return { status: res.status, data };
}

beforeAll(async () => {
  await new Promise((r) => setTimeout(r, 500));
});

// =========================================================================
// 1. Cannot execute without approval
// =========================================================================
describe("assistant gating — execution guard", () => {
  it("should reject direct approve on a non-proposed action (double-approve yields 409)", async () => {
    const homeId = crypto.randomUUID();

    const propose = await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [{ aggregateType: "task", eventType: "TaskCreated", data: { homeId, title: "Gated Task" } }],
      confidence: 0.85,
      rationale: "Test gating logic",
    });
    expect(propose.status).toBe(201);
    const actionId = propose.data.assistantActionId as string;

    const approve = await v2("POST", `/assistant/actions/${actionId}/approve`, {});
    expect(approve.status).toBe(200);

    const doubleApprove = await v2("POST", `/assistant/actions/${actionId}/approve`, {});
    expect(doubleApprove.status).toBe(409);
    expect(doubleApprove.data.aggregateType).toBe("assistant_action");
    expect(doubleApprove.data.currentState).toBeDefined();
  });

  it("should reject approve after rejection (409 with currentState='rejected')", async () => {
    const homeId = crypto.randomUUID();

    const propose = await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [],
      confidence: 0.5,
    });
    expect(propose.status).toBe(201);
    const actionId = propose.data.assistantActionId as string;

    const reject = await v2("POST", `/assistant/actions/${actionId}/reject`, {
      reason: "Not relevant",
    });
    expect(reject.status).toBe(200);

    const approve = await v2("POST", `/assistant/actions/${actionId}/approve`, {});
    expect(approve.status).toBe(409);
    expect(approve.data.currentState).toBe("rejected");
  });
});

// =========================================================================
// 2. Provenance and confidence metadata
// =========================================================================
describe("assistant gating — provenance", () => {
  it("should store confidence and rationale in projection", async () => {
    const homeId = crypto.randomUUID();

    const propose = await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [{ aggregateType: "task", eventType: "TaskCreated", data: { homeId, title: "Provenance Test" } }],
      confidence: 0.92,
      rationale: "High confidence based on system age",
    });
    expect(propose.status).toBe(201);
    const actionId = propose.data.assistantActionId as string;

    const row = await pool.query(
      `SELECT provenance, proposed_commands FROM projection_assistant_action WHERE assistant_action_id = $1`,
      [actionId],
    );
    expect(row.rows.length).toBe(1);
    expect(row.rows[0].provenance.confidence).toBe(0.92);
    expect(row.rows[0].provenance.rationale).toBe("High confidence based on system age");
    expect(row.rows[0].proposed_commands.length).toBe(1);
  });

  it("should record full event trail with correlation IDs", async () => {
    const homeId = crypto.randomUUID();

    const propose = await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [{ aggregateType: "task", eventType: "TaskCreated", data: { homeId, title: "Correlated Task" } }],
      confidence: 0.8,
    });
    const actionId = propose.data.assistantActionId as string;

    await v2("POST", `/assistant/actions/${actionId}/approve`, {});

    const stream = await v2Get(`/events/stream/assistant_action/${actionId}`);
    expect(stream.status).toBe(200);
    const events = stream.data.events as Array<Record<string, unknown>>;

    expect(events.length).toBeGreaterThanOrEqual(3);

    const types = events.map((e) => e.event_type);
    expect(types).toContain("AssistantActionProposed");
    expect(types).toContain("AssistantActionApproved");
    expect(types).toContain("AssistantActionExecuted");

    const executedEvent = events.find((e) => e.event_type === "AssistantActionExecuted");
    expect(executedEvent).toBeDefined();
    const execData = executedEvent!.data as Record<string, unknown>;
    expect((execData.eventIds as string[]).length).toBeGreaterThanOrEqual(1);
  });
});

// =========================================================================
// 3. GET endpoints for traceability
// =========================================================================
describe("assistant gating — query endpoints", () => {
  it("should return single action via GET /actions/:id", async () => {
    const homeId = crypto.randomUUID();

    const propose = await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [],
      confidence: 0.7,
      rationale: "Test query",
    });
    const actionId = propose.data.assistantActionId as string;

    const get = await v2Get(`/assistant/actions/${actionId}`);
    expect(get.status).toBe(200);
    expect(get.data.assistantActionId).toBe(actionId);
    expect(get.data.homeId).toBe(homeId);
    expect(get.data.state).toBe("proposed");
    expect((get.data.provenance as Record<string, unknown>).confidence).toBe(0.7);
  });

  it("should return 404 for non-existent action", async () => {
    const fakeId = crypto.randomUUID();
    const get = await v2Get(`/assistant/actions/${fakeId}`);
    expect(get.status).toBe(404);
  });

  it("should list actions by homeId via GET /actions?homeId=...", async () => {
    const homeId = crypto.randomUUID();

    await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [],
      confidence: 0.6,
    });
    await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [],
      confidence: 0.9,
    });

    const list = await v2Get(`/assistant/actions?homeId=${homeId}`);
    expect(list.status).toBe(200);
    const actions = list.data.actions as unknown[];
    expect(actions.length).toBe(2);
  });

  it("should return 400 when homeId is missing from list query", async () => {
    const list = await v2Get("/assistant/actions");
    expect(list.status).toBe(400);
  });
});

// =========================================================================
// 4. Full lifecycle — propose → approve → execute → verify projections
// =========================================================================
describe("assistant gating — full lifecycle", () => {
  it("should execute proposed commands and update all projections on approval", async () => {
    const homeId = crypto.randomUUID();

    const propose = await v2("POST", "/assistant/actions/propose", {
      homeId,
      proposedCommands: [
        {
          aggregateType: "task",
          eventType: "TaskCreated",
          data: { homeId, title: "AI-Suggested Maintenance" },
          expectedVersion: 0,
        },
      ],
      confidence: 0.95,
      rationale: "System age exceeds maintenance interval",
    });
    expect(propose.status).toBe(201);
    const actionId = propose.data.assistantActionId as string;

    const approve = await v2("POST", `/assistant/actions/${actionId}/approve`, {});
    expect(approve.status).toBe(200);
    expect(approve.data.assistantActionId).toBe(actionId);
    expect((approve.data.eventIds as string[]).length).toBe(1);

    const actionRow = await pool.query(
      `SELECT state FROM projection_assistant_action WHERE assistant_action_id = $1`,
      [actionId],
    );
    expect(actionRow.rows[0].state).toBe("executed");

    const get = await v2Get(`/assistant/actions/${actionId}`);
    expect(get.status).toBe(200);
    expect(get.data.state).toBe("executed");
  });
});
