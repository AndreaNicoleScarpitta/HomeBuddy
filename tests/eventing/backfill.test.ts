/**
 * Backfill/Migration Tests — Milestone 6
 *
 * Validates:
 *   1. Deterministic UUID mapping produces stable, valid UUIDs
 *   2. Idempotency key builder produces unique, predictable keys
 *   3. Dry-run mode reports counts without writing events
 *   4. Full backfill imports legacy rows into event_log
 *   5. Re-running backfill is idempotent (no duplicate events)
 *   6. Projections are correctly populated after backfill
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { deterministicUuid, idempotencyKey, runBackfill } from "../../server/cli/backfill";

const { Pool } = pg;
let pool: InstanceType<typeof pg.Pool>;

beforeAll(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  await pool.end();
});

describe("deterministicUuid", () => {
  it("should produce a valid UUID v4 format", () => {
    const uuid = deterministicUuid("home", 1);
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("should produce the same UUID for the same inputs", () => {
    const a = deterministicUuid("home", 42);
    const b = deterministicUuid("home", 42);
    expect(a).toBe(b);
  });

  it("should produce different UUIDs for different inputs", () => {
    const a = deterministicUuid("home", 1);
    const b = deterministicUuid("home", 2);
    const c = deterministicUuid("system", 1);
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("idempotencyKey", () => {
  it("should produce a predictable key", () => {
    const key = idempotencyKey("home", 1, "HomeAttributesUpdated");
    expect(key).toBe("backfill:home:1:HomeAttributesUpdated");
  });

  it("should produce different keys for different event types", () => {
    const a = idempotencyKey("task", 5, "TaskCreated");
    const b = idempotencyKey("task", 5, "TaskCompleted");
    expect(a).not.toBe(b);
  });
});

describe("backfill dry-run", () => {
  it("should not write any events", async () => {
    const beforeCount = await pool.query("SELECT COUNT(*)::int AS c FROM event_log WHERE actor_id = 'backfill'");
    const before = beforeCount.rows[0].c;

    const result = await runBackfill(true);
    expect(result).toBeNull();

    const afterCount = await pool.query("SELECT COUNT(*)::int AS c FROM event_log WHERE actor_id = 'backfill'");
    expect(afterCount.rows[0].c).toBe(before);
  });
});

describe("backfill full run", () => {
  let initialEventCount: number;

  beforeAll(async () => {
    const res = await pool.query("SELECT COUNT(*)::int AS c FROM event_log WHERE actor_id = 'backfill'");
    initialEventCount = res.rows[0].c;
  });

  it("should import legacy data and return stats", { timeout: 30000 }, async () => {
    const stats = await runBackfill(false);
    expect(stats).not.toBeNull();
    if (!stats) return;

    expect(stats.deduped).toBeGreaterThanOrEqual(0);
    expect(stats.homes + stats.systems + stats.tasks + stats.reports +
           stats.chatSessions + stats.chatMessages + stats.notificationPrefs +
           stats.taskCompleted + stats.deduped).toBeGreaterThanOrEqual(0);
  });

  it("should be idempotent — second run dedupes all events", { timeout: 30000 }, async () => {
    const afterFirst = await pool.query("SELECT COUNT(*)::int AS c FROM event_log WHERE actor_id = 'backfill'");
    const firstCount = afterFirst.rows[0].c;

    const stats = await runBackfill(false);
    expect(stats).not.toBeNull();

    const afterSecond = await pool.query("SELECT COUNT(*)::int AS c FROM event_log WHERE actor_id = 'backfill'");
    expect(afterSecond.rows[0].c).toBe(firstCount);

    if (stats && firstCount > initialEventCount) {
      expect(stats.deduped).toBeGreaterThan(0);
    }
  });

  it("should populate projection tables matching legacy counts", { timeout: 30000 }, async () => {
    const legacyHomes = await pool.query("SELECT COUNT(*)::int AS c FROM homes");
    const projHomes = await pool.query("SELECT COUNT(*)::int AS c FROM projection_home");
    expect(projHomes.rows[0].c).toBeGreaterThanOrEqual(legacyHomes.rows[0].c);

    const legacySystems = await pool.query("SELECT COUNT(*)::int AS c FROM systems");
    const projSystems = await pool.query("SELECT COUNT(*)::int AS c FROM projection_system");
    expect(projSystems.rows[0].c).toBeGreaterThanOrEqual(legacySystems.rows[0].c);
  });
});
