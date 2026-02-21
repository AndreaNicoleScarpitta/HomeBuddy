/**
 * CLI: Backfill existing CRUD data into event_log
 *
 * Imports existing rows from CRUD tables (homes, systems, tasks, etc.)
 * into the event_log as *Imported events.  Uses idempotency keys derived
 * from the original row IDs, so it is safe to re-run.
 *
 * Usage:  npx tsx server/cli/backfill.ts [--dry-run]
 *
 * This script will be fully implemented in Milestone 6 (Backfill/Migration).
 */

console.log("[backfill] Backfill CLI — placeholder (Milestone 6)");
console.log("[backfill] Run with --dry-run to preview without writing.");
process.exit(0);
