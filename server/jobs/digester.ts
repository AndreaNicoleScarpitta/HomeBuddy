/**
 * Digest Generator Job Handler
 *
 * Processes digest_generate jobs by collecting recent events for a home
 * and creating a notification digest summary. In production, this would
 * aggregate task updates, overdue items, and system health changes into
 * a formatted digest that can be emailed or pushed to the user.
 *
 * Currently a placeholder that logs digest generation.
 */

import { sql } from "drizzle-orm";
import crypto from "crypto";
import { append } from "../eventing/eventStore";
import { applyEvent } from "../projections/applyEvent";
import { EventTypes } from "../eventing/types";

type Tx = Parameters<Parameters<typeof import("../db").db.transaction>[0]>[0];

export async function handleDigestGenerate(
  tx: Tx,
  payload: Record<string, unknown>,
): Promise<void> {
  const homeId = payload.homeId as string;
  const period = (payload.period as string) ?? "weekly";
  if (!homeId) throw new Error("digest_generate job requires homeId in payload");

  const tasks = await tx.execute(sql`
    SELECT task_id, title, state, due_at
    FROM projection_task
    WHERE home_id = ${homeId}
      AND (state = 'overdue' OR state = 'approved' OR state = 'in_progress')
    ORDER BY due_at ASC NULLS LAST
    LIMIT 20
  `);

  const digestContent = {
    homeId,
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalActionableItems: tasks.rows.length,
      overdueCount: tasks.rows.filter((r: Record<string, unknown>) => r.state === "overdue").length,
      inProgressCount: tasks.rows.filter((r: Record<string, unknown>) => r.state === "in_progress").length,
    },
    items: tasks.rows.map((r: Record<string, unknown>) => ({
      taskId: r.task_id,
      title: r.title,
      state: r.state,
      dueAt: r.due_at,
    })),
  };

  console.log(`[digester] Generated ${period} digest for home ${homeId}: ${tasks.rows.length} items`);

  const idempotencyKey = `digest-${homeId}-${period}-${new Date().toISOString().split("T")[0]}`;

  const digestId = crypto.randomUUID();
  const eventData = { digestId, period };

  const result = await append(tx, {
    aggregateType: "home",
    aggregateId: homeId,
    expectedVersion: -1,
    eventType: EventTypes.DigestDelivered,
    data: eventData,
    meta: { source: "digest_worker", summary: digestContent },
    actor: { actorType: "system", actorId: "worker" },
    idempotencyKey,
  });

  if (!result.deduped) {
    await applyEvent(tx, {
      event_seq: result.eventSeq,
      event_id: result.eventId,
      aggregate_type: "home",
      aggregate_id: homeId,
      aggregate_version: result.version,
      event_type: EventTypes.DigestDelivered,
      data: eventData as Record<string, unknown>,
      meta: { source: "digest_worker", summary: digestContent } as Record<string, unknown>,
      actor_type: "system",
      actor_id: "worker",
      occurred_at: new Date().toISOString(),
    });
  }
}
