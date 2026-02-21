/**
 * Background Job Worker
 *
 * Polls the job_queue table using SELECT ... FOR UPDATE SKIP LOCKED to
 * claim and process background jobs without duplicate work.
 *
 * Job types handled:
 *   - report_analyze  — run AI analysis on an inspection report
 *   - digest_generate — generate a notification digest
 *   - reconcile       — run reconciliation checks
 *
 * Usage:  npx tsx server/worker/worker.ts
 *
 * Environment:
 *   POLL_INTERVAL_MS — polling interval in ms (default: 5000)
 *   BATCH_SIZE       — jobs per poll cycle (default: 5)
 */

import { db } from "../db";
import { lockJobs, completeJob, failJob } from "../jobs/queue";
import { handleReportAnalyze } from "../jobs/reportAnalyzer";
import { handleDigestGenerate } from "../jobs/digester";
import { handleReconcile } from "../jobs/reconciler";
import type { Job } from "../jobs/queue";

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS ?? "5000", 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE ?? "5", 10);
const MAX_RETRIES = 3;

let running = true;

type JobHandler = (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  payload: Record<string, unknown>,
) => Promise<void>;

/** Registry mapping job types to handler functions. */
const handlers: Record<string, JobHandler> = {
  report_analyze: handleReportAnalyze,
  digest_generate: handleDigestGenerate,
  reconcile: async (tx, _payload) => {
    await handleReconcile(tx);
  },
};

/**
 * Process a single job inside a transaction.
 * On success the job is marked completed; on failure it is retried or marked dead.
 */
async function processJob(job: Job): Promise<void> {
  const handler = handlers[job.jobType];
  if (!handler) {
    console.warn(`[worker] Unknown job type: ${job.jobType}, marking dead`);
    await db.transaction(async (tx) => {
      await failJob(tx, job.jobId, `Unknown job type: ${job.jobType}`, 1);
    });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      await handler(tx, job.payload);
      await completeJob(tx, job.jobId);
    });
    console.log(`[worker] Completed job ${job.jobId} (${job.jobType})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[worker] Job ${job.jobId} (${job.jobType}) failed: ${message}`);
    await db.transaction(async (tx) => {
      await failJob(tx, job.jobId, message, MAX_RETRIES);
    });
  }
}

/** Main poll loop — locks a batch of jobs and processes them sequentially. */
async function pollOnce(): Promise<number> {
  const jobs: Job[] = await db.transaction(async (tx) => {
    return lockJobs(tx, BATCH_SIZE);
  });

  for (const job of jobs) {
    await processJob(job);
  }

  return jobs.length;
}

async function run(): Promise<void> {
  console.log(`[worker] Starting job worker (poll=${POLL_INTERVAL_MS}ms, batch=${BATCH_SIZE})`);

  while (running) {
    try {
      const processed = await pollOnce();
      if (processed > 0) {
        console.log(`[worker] Processed ${processed} job(s)`);
      }
    } catch (err) {
      console.error("[worker] Poll cycle error:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  console.log("[worker] Shutting down");
}

process.on("SIGINT", () => { running = false; });
process.on("SIGTERM", () => { running = false; });

run().catch((err) => {
  console.error("[worker] Fatal error:", err);
  process.exit(1);
});
