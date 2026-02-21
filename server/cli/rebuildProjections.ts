/**
 * CLI: Rebuild projection tables from event_log
 *
 * Replays all events from event_log (or from a specific --from-seq) and
 * recomputes every projection table from scratch.  This is the primary
 * repair tool when projections get out of sync.
 *
 * Usage:  npx tsx server/cli/rebuildProjections.ts [--from-seq=0]
 *
 * This script will be fully implemented in Milestone 3 (State Machines).
 */

console.log("[rebuildProjections] Rebuild CLI — placeholder (Milestone 3)");
process.exit(0);
