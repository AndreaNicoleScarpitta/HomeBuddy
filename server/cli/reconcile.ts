/**
 * CLI: Reconcile stuck/overdue entities
 *
 * Scans projection tables for anomalies:
 *   - Reports stuck in "queued" state beyond 30-minute timeout threshold
 *   - Tasks past their due_at date still in "approved" or "scheduled" state
 *
 * Emits corrective events (RetryRequested, TaskOverdueMarked) to move
 * entities back into healthy states. Uses deterministic idempotency keys
 * to prevent duplicate corrections on repeated runs.
 *
 * Usage:  npx tsx server/cli/reconcile.ts
 */

import { db } from "../db";
import { handleReconcile } from "../jobs/reconciler";

async function main(): Promise<void> {
  console.log("[reconcile] Starting reconciliation...");

  const result = await db.transaction(async (tx) => {
    return handleReconcile(tx);
  });

  console.log(`[reconcile] Done — ${result.stuckReports} stuck reports, ${result.overdueTasks} overdue tasks corrected`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[reconcile] Fatal error:", err);
  process.exit(1);
});
