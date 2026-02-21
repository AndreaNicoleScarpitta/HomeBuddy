/**
 * Background job worker
 *
 * Polls the job_queue table using SELECT ... FOR UPDATE SKIP LOCKED to
 * claim and process background jobs without duplicate work.
 *
 * Job types handled:
 *   - report_analyze(report_id)   — run AI analysis on an inspection report
 *   - digest_generate(home_id)    — generate a notification digest
 *   - reconcile(now)              — run reconciliation checks
 *
 * Usage:  npx tsx server/worker/worker.ts
 *
 * This worker will be fully implemented in Milestone 5 (Workers & Reconciliation).
 */

console.log("[worker] Job worker — placeholder (Milestone 5)");
console.log("[worker] Will process jobs from job_queue using SKIP LOCKED.");
process.exit(0);
