/**
 * CLI: Reconcile stuck/overdue entities
 *
 * Scans projection tables for anomalies:
 *   - Reports stuck in "analyzing" state beyond a timeout threshold
 *   - Tasks past their due_at date still in "approved" or "scheduled" state
 *
 * Emits corrective events (RetryRequested, TaskOverdueMarked) to move
 * entities back into healthy states.
 *
 * Usage:  npx tsx server/cli/reconcile.ts [--now]
 *
 * This script will be fully implemented in Milestone 5 (Workers & Reconciliation).
 */

console.log("[reconcile] Reconcile CLI — placeholder (Milestone 5)");
process.exit(0);
