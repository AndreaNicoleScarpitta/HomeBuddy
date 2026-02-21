/**
 * Job Queue — Postgres-backed job queue using SELECT ... FOR UPDATE SKIP LOCKED.
 *
 * Provides enqueue/lock/complete/fail primitives for background job processing.
 * Multiple workers can safely consume jobs concurrently without duplicate work.
 *
 * Job types:
 *   - report_analyze(report_id)   — run AI analysis on an inspection report
 *   - digest_generate(home_id, period) — generate a notification digest
 *   - reconcile(now)              — run reconciliation checks
 */

import { sql } from "drizzle-orm";
import crypto from "crypto";

type Tx = Parameters<Parameters<typeof import("../db").db.transaction>[0]>[0];

export interface Job {
  jobId: string;
  jobType: string;
  payload: Record<string, unknown>;
  runAfter: Date;
  attempts: number;
  status: string;
  lockedAt: Date | null;
  lastError: string | null;
}

export interface EnqueueInput {
  jobType: string;
  payload: Record<string, unknown>;
  runAfter?: Date;
}

/**
 * Enqueue a new job into job_queue with status 'pending'.
 */
export async function enqueue(tx: Tx, input: EnqueueInput): Promise<string> {
  const jobId = crypto.randomUUID();
  const runAfter = input.runAfter ?? new Date();

  await tx.execute(sql`
    INSERT INTO job_queue (job_id, job_type, payload, run_after, attempts, status)
    VALUES (
      ${jobId}::uuid,
      ${input.jobType},
      ${JSON.stringify(input.payload)}::jsonb,
      ${runAfter.toISOString()}::timestamptz,
      0,
      'pending'
    )
  `);

  return jobId;
}

/**
 * Lock up to `limit` pending jobs that are ready to run (run_after <= now).
 * Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing by concurrent workers.
 */
export async function lockJobs(tx: Tx, limit: number = 5): Promise<Job[]> {
  const result = await tx.execute(sql`
    UPDATE job_queue
    SET status = 'running', locked_at = now()
    WHERE job_id IN (
      SELECT job_id FROM job_queue
      WHERE status = 'pending'
        AND run_after <= now()
      ORDER BY run_after ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING job_id, job_type, payload, run_after, attempts, status, locked_at, last_error
  `);

  return result.rows.map(mapRow);
}

/**
 * Mark a job as completed.
 */
export async function completeJob(tx: Tx, jobId: string): Promise<void> {
  await tx.execute(sql`
    UPDATE job_queue
    SET status = 'completed', locked_at = null
    WHERE job_id = ${jobId}::uuid
  `);
}

/**
 * Mark a job as failed. Increments attempt counter and records error message.
 * If attempts < maxRetries, resets status to 'pending' with a backoff delay.
 */
export async function failJob(
  tx: Tx,
  jobId: string,
  error: string,
  maxRetries: number = 3,
): Promise<void> {
  const row = await tx.execute(sql`
    SELECT attempts FROM job_queue WHERE job_id = ${jobId}::uuid
  `);

  if (row.rows.length === 0) return;

  const attempts = (row.rows[0] as { attempts: number }).attempts + 1;

  if (attempts >= maxRetries) {
    await tx.execute(sql`
      UPDATE job_queue
      SET status = 'dead',
          attempts = ${attempts},
          last_error = ${error},
          locked_at = null
      WHERE job_id = ${jobId}::uuid
    `);
  } else {
    const backoffSeconds = Math.pow(2, attempts) * 10;
    await tx.execute(sql`
      UPDATE job_queue
      SET status = 'pending',
          attempts = ${attempts},
          last_error = ${error},
          locked_at = null,
          run_after = now() + (${backoffSeconds} || ' seconds')::interval
      WHERE job_id = ${jobId}::uuid
    `);
  }
}

/**
 * Get a single job by ID.
 */
export async function getJob(tx: Tx, jobId: string): Promise<Job | null> {
  const result = await tx.execute(sql`
    SELECT job_id, job_type, payload, run_after, attempts, status, locked_at, last_error
    FROM job_queue
    WHERE job_id = ${jobId}::uuid
  `);
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

function mapRow(r: Record<string, unknown>): Job {
  return {
    jobId: r.job_id as string,
    jobType: r.job_type as string,
    payload: r.payload as Record<string, unknown>,
    runAfter: new Date(r.run_after as string),
    attempts: r.attempts as number,
    status: r.status as string,
    lockedAt: r.locked_at ? new Date(r.locked_at as string) : null,
    lastError: r.last_error as string | null,
  };
}
