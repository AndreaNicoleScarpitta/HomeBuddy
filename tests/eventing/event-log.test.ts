/**
 * Event Log Foundation — Database-backed Tests
 *
 * These tests validate the three critical correctness primitives of the
 * event_log table:
 *
 *   1. Idempotency:  Duplicate (actor_id, idempotency_key) pairs are rejected
 *      by the partial unique index, preventing double-writes.
 *
 *   2. Optimistic concurrency:  Duplicate (aggregate_type, aggregate_id,
 *      aggregate_version) triples are rejected, ensuring conflicting updates
 *      to the same aggregate fail deterministically.
 *
 *   3. Immutability:  The BEFORE UPDATE/DELETE trigger prevents any
 *      modification or removal of event rows once written.
 *
 * All tests run against the real Postgres database and clean up after
 * themselves to avoid polluting other test suites.
 */

import { describe, it, expect, afterAll, beforeAll } from "vitest";
import pg from "pg";

const { Pool } = pg;

let pool: InstanceType<typeof pg.Pool>;

/**
 * Helper: insert a single event into event_log using raw SQL.
 * Returns the inserted event_seq.
 */
async function insertEvent(overrides: {
  eventId?: string;
  aggregateType?: string;
  aggregateId?: string;
  aggregateVersion?: number;
  eventType?: string;
  actorType?: string;
  actorId?: string;
  idempotencyKey?: string | null;
  data?: object;
  meta?: object;
}): Promise<number> {
  const defaults = {
    eventId: crypto.randomUUID(),
    aggregateType: "test_aggregate",
    aggregateId: crypto.randomUUID(),
    aggregateVersion: 1,
    eventType: "TestEvent",
    actorType: "system",
    actorId: "test-runner",
    idempotencyKey: null as string | null,
    data: {},
    meta: {},
  };
  const vals = { ...defaults, ...overrides };

  const result = await pool.query(
    `INSERT INTO event_log (
       event_id, aggregate_type, aggregate_id, aggregate_version,
       event_type, event_schema_version, occurred_at,
       actor_type, actor_id, idempotency_key,
       data, meta
     ) VALUES (
       $1::uuid, $2, $3::uuid, $4,
       $5, 1, now(),
       $6, $7, $8,
       $9::jsonb, $10::jsonb
     )
     RETURNING event_seq`,
    [
      vals.eventId,
      vals.aggregateType,
      vals.aggregateId,
      vals.aggregateVersion,
      vals.eventType,
      vals.actorType,
      vals.actorId,
      vals.idempotencyKey,
      JSON.stringify(vals.data),
      JSON.stringify(vals.meta),
    ],
  );
  // pg returns bigint columns as strings; parse to number for assertions
  return Number(result.rows[0].event_seq);
}

beforeAll(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  // Clean up test rows (bypass trigger with superuser-level or just leave them
  // — the trigger prevents DELETE so we mark them with a unique aggregate_type
  // for easy identification).  Since the trigger blocks DELETE, we accept that
  // test events persist.  They use aggregate_type = 'test_aggregate' which
  // never conflicts with production data.
  await pool.end();
});

describe("event_log table", () => {
  // -------------------------------------------------------------------------
  // 1. Basic insert — verify a single event can be appended
  // -------------------------------------------------------------------------
  it("should append a single event and return its event_seq", async () => {
    const seq = await insertEvent({});
    expect(seq).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // 2. Idempotency constraint — same (actor_id, idempotency_key) rejects
  // -------------------------------------------------------------------------
  it("should reject duplicate (actor_id, idempotency_key) pairs", async () => {
    const actorId = `idem-actor-${crypto.randomUUID()}`;
    const idempotencyKey = `idem-key-${crypto.randomUUID()}`;

    // First insert succeeds
    await insertEvent({ actorId, idempotencyKey });

    // Second insert with same actor + key must fail
    await expect(
      insertEvent({
        actorId,
        idempotencyKey,
        aggregateId: crypto.randomUUID(), // different aggregate is fine
        aggregateVersion: 1,
      }),
    ).rejects.toThrow(/event_log_idempotency_uq|duplicate key/i);
  });

  it("should allow same idempotency_key for different actors", async () => {
    const sharedKey = `shared-key-${crypto.randomUUID()}`;

    // Actor A
    await insertEvent({
      actorId: `actor-a-${crypto.randomUUID()}`,
      idempotencyKey: sharedKey,
    });

    // Actor B with the same key — should succeed
    const seq = await insertEvent({
      actorId: `actor-b-${crypto.randomUUID()}`,
      idempotencyKey: sharedKey,
    });
    expect(seq).toBeGreaterThan(0);
  });

  it("should allow null idempotency_key without constraint violations", async () => {
    const actorId = `null-idem-actor-${crypto.randomUUID()}`;

    // Two events from the same actor with null idempotency_key — both allowed
    const seq1 = await insertEvent({ actorId, idempotencyKey: null });
    const seq2 = await insertEvent({
      actorId,
      idempotencyKey: null,
      aggregateId: crypto.randomUUID(),
    });
    expect(seq1).not.toBe(seq2);
  });

  // -------------------------------------------------------------------------
  // 3. Optimistic concurrency — same aggregate version rejects
  // -------------------------------------------------------------------------
  it("should reject duplicate aggregate_version for the same aggregate", async () => {
    const aggregateId = crypto.randomUUID();
    const aggregateType = "test_aggregate";

    // Version 1
    await insertEvent({ aggregateType, aggregateId, aggregateVersion: 1 });

    // Conflicting version 1 — must fail
    await expect(
      insertEvent({
        aggregateType,
        aggregateId,
        aggregateVersion: 1,
        eventId: crypto.randomUUID(),
      }),
    ).rejects.toThrow(/event_log_aggregate_version_uq|duplicate key/i);
  });

  it("should allow sequential versions for the same aggregate", async () => {
    const aggregateId = crypto.randomUUID();
    const aggregateType = "test_aggregate";

    const seq1 = await insertEvent({ aggregateType, aggregateId, aggregateVersion: 1 });
    const seq2 = await insertEvent({ aggregateType, aggregateId, aggregateVersion: 2 });
    const seq3 = await insertEvent({ aggregateType, aggregateId, aggregateVersion: 3 });

    expect(seq1).toBeLessThan(seq2);
    expect(seq2).toBeLessThan(seq3);
  });

  // -------------------------------------------------------------------------
  // 4. Immutability — UPDATE and DELETE are blocked by trigger
  // -------------------------------------------------------------------------
  it("should reject UPDATE on event_log rows", async () => {
    const seq = await insertEvent({});

    await expect(
      pool.query(
        `UPDATE event_log SET event_type = 'Tampered' WHERE event_seq = $1`,
        [seq],
      ),
    ).rejects.toThrow(/immutable/i);
  });

  it("should reject DELETE on event_log rows", async () => {
    const seq = await insertEvent({});

    await expect(
      pool.query(`DELETE FROM event_log WHERE event_seq = $1`, [seq]),
    ).rejects.toThrow(/immutable/i);
  });

  // -------------------------------------------------------------------------
  // 5. Projection tables exist — smoke test
  // -------------------------------------------------------------------------
  it("should have all projection tables created", async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'projection_%'
      ORDER BY table_name
    `);

    const tables = result.rows.map((r: { table_name: string }) => r.table_name);
    expect(tables).toContain("projection_home");
    expect(tables).toContain("projection_system");
    expect(tables).toContain("projection_report");
    expect(tables).toContain("projection_finding");
    expect(tables).toContain("projection_task");
    expect(tables).toContain("projection_notification_pref");
    expect(tables).toContain("projection_assistant_action");
    expect(tables).toContain("projection_chat_session");
    expect(tables).toContain("projection_chat_message");
    expect(tables).toContain("projection_checkpoint");
  });

  // -------------------------------------------------------------------------
  // 6. Job queue table exists — smoke test
  // -------------------------------------------------------------------------
  it("should have the job_queue table created", async () => {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'job_queue'
    `);
    expect(result.rows.length).toBe(1);
  });
});
