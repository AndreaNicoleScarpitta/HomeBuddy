/**
 * Reconciler Job Handler
 *
 * Detects and repairs inconsistent aggregate states:
 *
 *   1. Stuck reports — reports in 'queued' state for longer than a timeout
 *      threshold. Emits RetryRequested to requeue analysis.
 *
 *   2. Overdue tasks — tasks past their due_at date still in 'approved' or
 *      'scheduled' state. Emits TaskOverdueMarked to update their lifecycle.
 *
 * All corrective events use idempotency keys derived from the aggregate ID
 * to prevent duplicate corrections on repeated reconciliation runs.
 */

import { sql } from "drizzle-orm";
import { append, getCurrentVersion } from "../eventing/eventStore";
import { applyEvent } from "../projections/applyEvent";
import { EventTypes } from "../eventing/types";

type Tx = Parameters<Parameters<typeof import("../db").db.transaction>[0]>[0];

const STUCK_REPORT_TIMEOUT_MINUTES = 30;

export interface ReconcileResult {
  stuckReports: number;
  overdueTasks: number;
}

export async function handleReconcile(tx: Tx): Promise<ReconcileResult> {
  const stuckReports = await reconcileStuckReports(tx);
  const overdueTasks = await reconcileOverdueTasks(tx);
  return { stuckReports, overdueTasks };
}

async function reconcileStuckReports(tx: Tx): Promise<number> {
  const stuckRows = await tx.execute(sql`
    SELECT report_id
    FROM projection_report
    WHERE state = 'queued'
      AND updated_at < now() - (${STUCK_REPORT_TIMEOUT_MINUTES} || ' minutes')::interval
    LIMIT 50
  `);

  let count = 0;
  for (const row of stuckRows.rows) {
    const reportId = (row as { report_id: string }).report_id;
    const idempotencyKey = `reconcile-retry-${reportId}-${new Date().toISOString().split("T")[0]}`;

    try {
      const ver = await getCurrentVersion(tx, "report", reportId);
      const result = await append(tx, {
        aggregateType: "report",
        aggregateId: reportId,
        expectedVersion: ver,
        eventType: EventTypes.RetryRequested,
        data: {
          reason: `Report stuck in queued state for >${STUCK_REPORT_TIMEOUT_MINUTES} minutes`,
          retriedAt: new Date().toISOString(),
        },
        meta: { source: "reconciler" },
        actor: { actorType: "system", actorId: "reconciler" },
        idempotencyKey,
      });

      if (!result.deduped) {
        await applyEvent(tx, {
          event_seq: result.eventSeq,
          event_id: result.eventId,
          aggregate_type: "report",
          aggregate_id: reportId,
          aggregate_version: result.version,
          event_type: EventTypes.RetryRequested,
          data: {
            reason: `Report stuck in queued state for >${STUCK_REPORT_TIMEOUT_MINUTES} minutes`,
            retriedAt: new Date().toISOString(),
          } as Record<string, unknown>,
          meta: { source: "reconciler" },
          actor_type: "system",
          actor_id: "reconciler",
          occurred_at: new Date().toISOString(),
        });
        count++;
      }
    } catch (err) {
      console.error(`[reconciler] Failed to emit RetryRequested for report ${reportId}:`, err);
    }
  }

  if (count > 0) {
    console.log(`[reconciler] Emitted RetryRequested for ${count} stuck reports`);
  }
  return count;
}

async function reconcileOverdueTasks(tx: Tx): Promise<number> {
  const overdueRows = await tx.execute(sql`
    SELECT task_id
    FROM projection_task
    WHERE state IN ('approved', 'scheduled')
      AND due_at IS NOT NULL
      AND due_at < now()
    LIMIT 100
  `);

  let count = 0;
  for (const row of overdueRows.rows) {
    const taskId = (row as { task_id: string }).task_id;
    const idempotencyKey = `reconcile-overdue-${taskId}-${new Date().toISOString().split("T")[0]}`;

    try {
      const ver = await getCurrentVersion(tx, "task", taskId);
      const result = await append(tx, {
        aggregateType: "task",
        aggregateId: taskId,
        expectedVersion: ver,
        eventType: EventTypes.TaskOverdueMarked,
        data: {
          reason: "Task past due date detected by reconciliation",
          markedAt: new Date().toISOString(),
        },
        meta: { source: "reconciler" },
        actor: { actorType: "system", actorId: "reconciler" },
        idempotencyKey,
      });

      if (!result.deduped) {
        await applyEvent(tx, {
          event_seq: result.eventSeq,
          event_id: result.eventId,
          aggregate_type: "task",
          aggregate_id: taskId,
          aggregate_version: result.version,
          event_type: EventTypes.TaskOverdueMarked,
          data: {
            reason: "Task past due date detected by reconciliation",
            markedAt: new Date().toISOString(),
          } as Record<string, unknown>,
          meta: { source: "reconciler" },
          actor_type: "system",
          actor_id: "reconciler",
          occurred_at: new Date().toISOString(),
        });
        count++;
      }
    } catch (err) {
      console.error(`[reconciler] Failed to emit TaskOverdueMarked for task ${taskId}:`, err);
    }
  }

  if (count > 0) {
    console.log(`[reconciler] Emitted TaskOverdueMarked for ${count} overdue tasks`);
  }
  return count;
}
