/**
 * Milestone 5 — Workers & Reconciliation Tests
 *
 * Validates:
 *   1. Job queue CRUD (enqueue, lock, complete, fail with retry backoff)
 *   2. Reconciler detection of stuck reports and overdue tasks
 *   3. Idempotent corrective events (no duplicates on repeated reconciliation)
 *   4. Report analyzer producing correct event data shape
 *
 * All tests run against the real Postgres database and clean up by using
 * unique aggregate IDs to avoid polluting other test suites.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import pg from "pg";
import { db } from "../../server/db";
import { sql } from "drizzle-orm";
import { enqueue, lockJobs, completeJob, failJob, getJob } from "../../server/jobs/queue";
import { handleReconcile } from "../../server/jobs/reconciler";
import { handleReportAnalyze } from "../../server/jobs/reportAnalyzer";
import { append } from "../../server/eventing/eventStore";
import { applyEvent } from "../../server/projections/applyEvent";
import { EventTypes } from "../../server/eventing/types";

const { Pool } = pg;
let pool: InstanceType<typeof pg.Pool>;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Helper: create a report in 'queued' state via event sourcing.
 * Seeds both event_log and projection_report.
 */
async function seedQueuedReport(tx: Tx, reportId: string, homeId: string): Promise<void> {
  const uploadResult = await append(tx, {
    aggregateType: "report",
    aggregateId: reportId,
    expectedVersion: 0,
    eventType: EventTypes.InspectionReportUploaded,
    data: { homeId },
    meta: {},
    actor: { actorType: "user", actorId: "test-user" },
    idempotencyKey: `seed-upload-${reportId}`,
  });

  await applyEvent(tx, {
    event_seq: uploadResult.eventSeq,
    event_id: uploadResult.eventId,
    aggregate_type: "report",
    aggregate_id: reportId,
    aggregate_version: uploadResult.version,
    event_type: EventTypes.InspectionReportUploaded,
    data: { homeId } as Record<string, unknown>,
    meta: {},
    actor_type: "user",
    actor_id: "test-user",
    occurred_at: new Date().toISOString(),
  });

  const queueResult = await append(tx, {
    aggregateType: "report",
    aggregateId: reportId,
    expectedVersion: uploadResult.version,
    eventType: EventTypes.InspectionReportAnalysisQueued,
    data: {},
    meta: {},
    actor: { actorType: "system", actorId: "test" },
    idempotencyKey: `seed-queue-${reportId}`,
  });

  await applyEvent(tx, {
    event_seq: queueResult.eventSeq,
    event_id: queueResult.eventId,
    aggregate_type: "report",
    aggregate_id: reportId,
    aggregate_version: queueResult.version,
    event_type: EventTypes.InspectionReportAnalysisQueued,
    data: {},
    meta: {},
    actor_type: "system",
    actor_id: "test",
    occurred_at: new Date().toISOString(),
  });
}

/**
 * Helper: create a task in 'approved' state via event sourcing.
 * Seeds both event_log and projection_task with an explicit due_at.
 */
async function seedApprovedTask(tx: Tx, taskId: string, homeId: string, dueAt: Date): Promise<void> {
  const createResult = await append(tx, {
    aggregateType: "task",
    aggregateId: taskId,
    expectedVersion: 0,
    eventType: EventTypes.TaskCreated,
    data: { title: "Test Task", homeId, dueAt: dueAt.toISOString() },
    meta: {},
    actor: { actorType: "user", actorId: "test-user" },
    idempotencyKey: `seed-task-create-${taskId}`,
  });

  await applyEvent(tx, {
    event_seq: createResult.eventSeq,
    event_id: createResult.eventId,
    aggregate_type: "task",
    aggregate_id: taskId,
    aggregate_version: createResult.version,
    event_type: EventTypes.TaskCreated,
    data: { title: "Test Task", homeId, dueAt: dueAt.toISOString() } as Record<string, unknown>,
    meta: {},
    actor_type: "user",
    actor_id: "test-user",
    occurred_at: new Date().toISOString(),
  });

  const approveResult = await append(tx, {
    aggregateType: "task",
    aggregateId: taskId,
    expectedVersion: createResult.version,
    eventType: EventTypes.TaskApproved,
    data: {},
    meta: {},
    actor: { actorType: "user", actorId: "test-user" },
    idempotencyKey: `seed-task-approve-${taskId}`,
  });

  await applyEvent(tx, {
    event_seq: approveResult.eventSeq,
    event_id: approveResult.eventId,
    aggregate_type: "task",
    aggregate_id: taskId,
    aggregate_version: approveResult.version,
    event_type: EventTypes.TaskApproved,
    data: {},
    meta: {},
    actor_type: "user",
    actor_id: "test-user",
    occurred_at: new Date().toISOString(),
  });
}

beforeAll(async () => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  await pool.end();
});

// ---------------------------------------------------------------------------
// Job Queue CRUD
// ---------------------------------------------------------------------------
describe("job queue", () => {
  it("should enqueue a job and retrieve it", async () => {
    let jobId: string = "";
    await db.transaction(async (tx) => {
      jobId = await enqueue(tx, {
        jobType: "report_analyze",
        payload: { reportId: crypto.randomUUID() },
      });
    });

    const job = await db.transaction(async (tx) => getJob(tx, jobId));
    expect(job).not.toBeNull();
    expect(job!.jobType).toBe("report_analyze");
    expect(job!.status).toBe("pending");
    expect(job!.attempts).toBe(0);
  });

  it("should lock pending jobs and set them to running", async () => {
    const jobId = await db.transaction(async (tx) => {
      return enqueue(tx, {
        jobType: "test_lock_job",
        payload: { test: true },
      });
    });

    const locked = await db.transaction(async (tx) => lockJobs(tx, 100));
    const found = locked.find((j) => j.jobId === jobId);
    expect(found).toBeDefined();
    expect(found!.status).toBe("running");
  });

  it("should mark a job as completed", async () => {
    const jobId = await db.transaction(async (tx) => {
      return enqueue(tx, {
        jobType: "test_complete_job",
        payload: {},
      });
    });

    await db.transaction(async (tx) => {
      const jobs = await lockJobs(tx, 100);
      const j = jobs.find((j) => j.jobId === jobId);
      if (j) await completeJob(tx, j.jobId);
    });

    const job = await db.transaction(async (tx) => getJob(tx, jobId));
    expect(job!.status).toBe("completed");
  });

  it("should retry failed jobs with backoff up to max retries then mark dead", async () => {
    const jobId = await db.transaction(async (tx) => {
      return enqueue(tx, { jobType: "test_fail_job", payload: {} });
    });

    await db.transaction(async (tx) => {
      await failJob(tx, jobId, "first failure", 3);
    });
    let job = await db.transaction(async (tx) => getJob(tx, jobId));
    expect(job!.status).toBe("pending");
    expect(job!.attempts).toBe(1);
    expect(job!.lastError).toBe("first failure");

    await db.transaction(async (tx) => {
      await failJob(tx, jobId, "second failure", 3);
    });
    job = await db.transaction(async (tx) => getJob(tx, jobId));
    expect(job!.status).toBe("pending");
    expect(job!.attempts).toBe(2);

    await db.transaction(async (tx) => {
      await failJob(tx, jobId, "third failure", 3);
    });
    job = await db.transaction(async (tx) => getJob(tx, jobId));
    expect(job!.status).toBe("dead");
    expect(job!.attempts).toBe(3);
    expect(job!.lastError).toBe("third failure");
  });

  it("should not lock jobs with run_after in the future", async () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    const jobId = await db.transaction(async (tx) => {
      return enqueue(tx, {
        jobType: "test_future_job",
        payload: {},
        runAfter: futureDate,
      });
    });

    const locked = await db.transaction(async (tx) => lockJobs(tx, 100));
    const found = locked.find((j) => j.jobId === jobId);
    expect(found).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Report Analyzer
// ---------------------------------------------------------------------------
describe("report analyzer", () => {
  it("should emit InspectionReportAnalyzedDraft with draft data for queued reports", async () => {
    const reportId = crypto.randomUUID();
    const homeId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await seedQueuedReport(tx, reportId, homeId);
    });

    await db.transaction(async (tx) => {
      await handleReportAnalyze(tx, { reportId });
    });

    const result = await db.transaction(async (tx) => {
      return tx.execute(sql`
        SELECT state, draft FROM projection_report WHERE report_id = ${reportId}
      `);
    });

    expect(result.rows.length).toBe(1);
    const row = result.rows[0] as { state: string; draft: unknown };
    expect(row.state).toBe("draft_ready");
    expect(row.draft).toBeDefined();
  });

  it("should skip reports not in queued state", async () => {
    const reportId = crypto.randomUUID();
    const homeId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.execute(sql`
        INSERT INTO projection_report (report_id, home_id, state, last_event_seq)
        VALUES (${reportId}, ${homeId}, 'uploaded', 0)
      `);
    });

    await db.transaction(async (tx) => {
      await handleReportAnalyze(tx, { reportId });
    });

    const result = await db.transaction(async (tx) => {
      return tx.execute(sql`
        SELECT state FROM projection_report WHERE report_id = ${reportId}
      `);
    });

    expect((result.rows[0] as { state: string }).state).toBe("uploaded");
  });
});

// ---------------------------------------------------------------------------
// Reconciler
// ---------------------------------------------------------------------------
describe("reconciler", () => {
  it("should emit RetryRequested for reports stuck in queued state", async () => {
    const reportId = crypto.randomUUID();
    const homeId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await seedQueuedReport(tx, reportId, homeId);
    });

    await pool.query(`
      UPDATE projection_report
      SET updated_at = now() - interval '45 minutes'
      WHERE report_id = $1
    `, [reportId]);

    const result = await db.transaction(async (tx) => handleReconcile(tx));
    expect(result.stuckReports).toBeGreaterThanOrEqual(1);

    const events = await pool.query(`
      SELECT event_type FROM event_log
      WHERE aggregate_id = $1::uuid AND event_type = 'RetryRequested'
    `, [reportId]);
    expect(events.rows.length).toBe(1);
  });

  it("should emit TaskOverdueMarked for overdue tasks", async () => {
    const taskId = crypto.randomUUID();
    const homeId = crypto.randomUUID();
    const pastDue = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      await seedApprovedTask(tx, taskId, homeId, pastDue);
    });

    const result = await db.transaction(async (tx) => handleReconcile(tx));
    expect(result.overdueTasks).toBeGreaterThanOrEqual(1);

    const events = await pool.query(`
      SELECT event_type FROM event_log
      WHERE aggregate_id = $1::uuid AND event_type = 'TaskOverdueMarked'
    `, [taskId]);
    expect(events.rows.length).toBe(1);

    const taskRow = await db.transaction(async (tx) => {
      return tx.execute(sql`
        SELECT state FROM projection_task WHERE task_id = ${taskId}
      `);
    });
    expect((taskRow.rows[0] as { state: string }).state).toBe("overdue");
  });

  it("should not create duplicate events on repeated reconciliation runs", async () => {
    const taskId = crypto.randomUUID();
    const homeId = crypto.randomUUID();
    const pastDue = new Date(Date.now() - 48 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      await seedApprovedTask(tx, taskId, homeId, pastDue);
    });

    await db.transaction(async (tx) => handleReconcile(tx));

    const eventsAfterFirst = await pool.query(`
      SELECT event_type FROM event_log
      WHERE aggregate_id = $1::uuid AND event_type = 'TaskOverdueMarked'
    `, [taskId]);
    expect(eventsAfterFirst.rows.length).toBe(1);

    await db.transaction(async (tx) => handleReconcile(tx));

    const eventsAfterSecond = await pool.query(`
      SELECT event_type FROM event_log
      WHERE aggregate_id = $1::uuid AND event_type = 'TaskOverdueMarked'
    `, [taskId]);
    expect(eventsAfterSecond.rows.length).toBe(1);
  });

  it("should not flag reports that have been queued for less than the timeout", async () => {
    const reportId = crypto.randomUUID();
    const homeId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await seedQueuedReport(tx, reportId, homeId);
    });

    const result = await db.transaction(async (tx) => handleReconcile(tx));

    const events = await pool.query(`
      SELECT event_type FROM event_log
      WHERE aggregate_id = $1::uuid AND event_type = 'RetryRequested'
    `, [reportId]);
    expect(events.rows.length).toBe(0);
  });
});
