/**
 * CLI: Backfill existing CRUD data into event_log
 *
 * Imports existing rows from CRUD tables (homes, systems, tasks, etc.)
 * into the event_log as Imported events.  Uses idempotency keys derived
 * from the original row IDs, so it is safe to re-run.
 *
 * Usage:  npx tsx server/cli/backfill.ts [--dry-run]
 *
 * Milestone 6 (Backfill/Migration).
 */

import crypto from "crypto";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { append } from "../eventing/eventStore";
import { applyEvent } from "../projections/applyEvent";
import { rebuildAll } from "../projections/rebuild";
import { EventTypes } from "../eventing/types";

const BACKFILL_NAMESPACE = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const ACTOR = { actorType: "system" as const, actorId: "backfill" };

export function deterministicUuid(aggregateType: string, legacyId: number | string): string {
  const input = `${BACKFILL_NAMESPACE}:${aggregateType}:${legacyId}`;
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    "4" + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join("-");
}

export function idempotencyKey(aggregateType: string, legacyId: number | string, eventType: string): string {
  return `backfill:${aggregateType}:${legacyId}:${eventType}`;
}

type DrizzleTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function appendAndApply(
  tx: DrizzleTx,
  input: Parameters<typeof append>[1],
) {
  const result = await append(tx, input);
  if (!result.deduped) {
    await applyEvent(tx, {
      event_seq: result.eventSeq,
      event_id: result.eventId,
      aggregate_type: input.aggregateType,
      aggregate_id: input.aggregateId,
      aggregate_version: result.version,
      event_type: input.eventType,
      data: (input.data ?? {}) as Record<string, unknown>,
      meta: input.meta ?? {},
      actor_type: input.actor.actorType,
      actor_id: input.actor.actorId,
      occurred_at: new Date().toISOString(),
    });
  }
  return result;
}

interface BackfillStats {
  homes: number;
  systems: number;
  tasks: number;
  taskCompleted: number;
  reports: number;
  chatSessions: number;
  chatMessages: number;
  notificationPrefs: number;
  deduped: number;
}

async function backfillHomes(tx: DrizzleTx, stats: BackfillStats): Promise<Map<number, string>> {
  const homeMap = new Map<number, string>();
  const rows = await tx.execute(sql`SELECT * FROM homes ORDER BY id`);

  for (const row of rows.rows as any[]) {
    const uuid = deterministicUuid("home", row.id);
    homeMap.set(row.id, uuid);

    const attrs: Record<string, unknown> = {};
    for (const key of ["address", "street_address", "city", "state", "zip_code", "zip_plus_4",
      "address_verified", "built_year", "sq_ft", "beds", "baths", "type", "lot_size",
      "exterior_type", "roof_type", "last_sale_year", "home_value_estimate", "data_source",
      "zillow_url", "health_score"]) {
      if (row[key] != null) attrs[key] = row[key];
    }

    const result = await appendAndApply(tx, {
      aggregateType: "home",
      aggregateId: uuid,
      expectedVersion: 0,
      eventType: EventTypes.HomeAttributesUpdated,
      data: { attrs },
      meta: { source: "backfill", legacyId: row.id, userId: row.user_id },
      actor: ACTOR,
      idempotencyKey: idempotencyKey("home", row.id, EventTypes.HomeAttributesUpdated),
    });
    if (result.deduped) stats.deduped++; else stats.homes++;
  }

  return homeMap;
}

async function backfillSystems(tx: DrizzleTx, homeMap: Map<number, string>, stats: BackfillStats): Promise<Map<number, string>> {
  const systemMap = new Map<number, string>();
  const rows = await tx.execute(sql`SELECT * FROM systems ORDER BY id`);

  for (const row of rows.rows as any[]) {
    const homeUuid = homeMap.get(row.home_id);
    if (!homeUuid) {
      console.warn(`[backfill] Skipping system ${row.id}: home ${row.home_id} not found in map`);
      continue;
    }

    const uuid = deterministicUuid("system", row.id);
    systemMap.set(row.id, uuid);

    const attrs: Record<string, unknown> = {};
    for (const key of ["name", "make", "model", "install_year", "last_service_date",
      "next_service_date", "condition", "warranty_expiry", "material", "energy_rating",
      "provider", "treatment_type", "recurrence_interval", "contract_start_date",
      "cadence", "status_reason", "metadata", "notes", "photos", "documents", "source",
      "entity_type", "category"]) {
      if (row[key] != null) attrs[key] = row[key];
    }

    const result = await appendAndApply(tx, {
      aggregateType: "system",
      aggregateId: uuid,
      expectedVersion: 0,
      eventType: EventTypes.SystemAttributesUpserted,
      data: { homeId: homeUuid, systemType: row.category || null, attrs },
      meta: { source: "backfill", legacyId: row.id },
      actor: ACTOR,
      idempotencyKey: idempotencyKey("system", row.id, EventTypes.SystemAttributesUpserted),
    });
    if (result.deduped) stats.deduped++; else stats.systems++;
  }

  return systemMap;
}

async function backfillTasks(
  tx: DrizzleTx,
  homeMap: Map<number, string>,
  systemMap: Map<number, string>,
  stats: BackfillStats,
): Promise<void> {
  const rows = await tx.execute(sql`SELECT * FROM maintenance_tasks ORDER BY id`);

  for (const row of rows.rows as any[]) {
    const homeUuid = homeMap.get(row.home_id);
    if (!homeUuid) {
      console.warn(`[backfill] Skipping task ${row.id}: home ${row.home_id} not found in map`);
      continue;
    }

    const uuid = deterministicUuid("task", row.id);
    const systemUuid = row.related_system_id ? systemMap.get(row.related_system_id) : undefined;

    const estimates: Record<string, unknown> = {};
    if (row.estimated_cost) estimates.estimatedCost = row.estimated_cost;
    if (row.actual_cost) estimates.actualCost = row.actual_cost;
    if (row.difficulty) estimates.difficulty = row.difficulty;

    let version = 0;
    const createResult = await appendAndApply(tx, {
      aggregateType: "task",
      aggregateId: uuid,
      expectedVersion: version,
      eventType: EventTypes.TaskCreated,
      data: {
        homeId: homeUuid,
        systemId: systemUuid || null,
        title: row.title || "Untitled",
        estimates: Object.keys(estimates).length > 0 ? estimates : undefined,
        dueAt: row.due_date ? new Date(row.due_date).toISOString() : undefined,
      },
      meta: {
        source: "backfill",
        legacyId: row.id,
        description: row.description,
        category: row.category,
        urgency: row.urgency,
        diyLevel: row.diy_level,
        safetyWarning: row.safety_warning,
        createdFrom: row.created_from,
        isRecurring: row.is_recurring,
        recurrenceCadence: row.recurrence_cadence,
      },
      actor: ACTOR,
      idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskCreated),
    });
    if (createResult.deduped) {
      stats.deduped++;
      version = createResult.version;
    } else {
      stats.tasks++;
      version = createResult.version;
    }

    if (row.status === "completed") {
      const completeResult = await appendAndApply(tx, {
        aggregateType: "task",
        aggregateId: uuid,
        expectedVersion: version,
        eventType: EventTypes.TaskApproved,
        data: {},
        meta: { source: "backfill" },
        actor: ACTOR,
        idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskApproved),
      });
      if (completeResult.deduped) stats.deduped++; else version = completeResult.version;

      const startResult = await appendAndApply(tx, {
        aggregateType: "task",
        aggregateId: uuid,
        expectedVersion: version,
        eventType: EventTypes.TaskStarted,
        data: {},
        meta: { source: "backfill" },
        actor: ACTOR,
        idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskStarted),
      });
      if (startResult.deduped) stats.deduped++; else version = startResult.version;

      const doneResult = await appendAndApply(tx, {
        aggregateType: "task",
        aggregateId: uuid,
        expectedVersion: version,
        eventType: EventTypes.TaskCompleted,
        data: {
          completedAt: row.completed_at
            ? new Date(row.completed_at).toISOString()
            : new Date().toISOString(),
        },
        meta: { source: "backfill" },
        actor: ACTOR,
        idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskCompleted),
      });
      if (doneResult.deduped) stats.deduped++; else stats.taskCompleted++;
    } else if (row.status === "scheduled") {
      const approveResult = await appendAndApply(tx, {
        aggregateType: "task",
        aggregateId: uuid,
        expectedVersion: version,
        eventType: EventTypes.TaskApproved,
        data: {},
        meta: { source: "backfill" },
        actor: ACTOR,
        idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskApproved),
      });
      if (approveResult.deduped) stats.deduped++; else version = approveResult.version;

      const schedResult = await appendAndApply(tx, {
        aggregateType: "task",
        aggregateId: uuid,
        expectedVersion: version,
        eventType: EventTypes.TaskScheduled,
        data: { scheduledAt: row.due_date ? new Date(row.due_date).toISOString() : undefined },
        meta: { source: "backfill" },
        actor: ACTOR,
        idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskScheduled),
      });
      if (schedResult.deduped) stats.deduped++;
    } else if (row.status === "skipped") {
      const approveResult = await appendAndApply(tx, {
        aggregateType: "task",
        aggregateId: uuid,
        expectedVersion: version,
        eventType: EventTypes.TaskSkipped,
        data: { reason: "Legacy import — previously skipped" },
        meta: { source: "backfill" },
        actor: ACTOR,
        idempotencyKey: idempotencyKey("task", row.id, EventTypes.TaskSkipped),
      });
      if (approveResult.deduped) stats.deduped++;
    }
  }
}

async function backfillReports(tx: DrizzleTx, homeMap: Map<number, string>, stats: BackfillStats): Promise<void> {
  const rows = await tx.execute(sql`SELECT * FROM inspection_reports ORDER BY id`);

  for (const row of rows.rows as any[]) {
    const homeUuid = homeMap.get(row.home_id);
    if (!homeUuid) {
      console.warn(`[backfill] Skipping report ${row.id}: home ${row.home_id} not found in map`);
      continue;
    }

    const uuid = deterministicUuid("inspection_report", row.id);

    const result = await appendAndApply(tx, {
      aggregateType: "inspection_report",
      aggregateId: uuid,
      expectedVersion: 0,
      eventType: EventTypes.InspectionReportUploaded,
      data: {
        homeId: homeUuid,
        fileHash: row.file_name || null,
        storageRef: row.object_path || null,
      },
      meta: {
        source: "backfill",
        legacyId: row.id,
        reportType: row.report_type,
        inspectionDate: row.inspection_date,
        status: row.status,
        summary: row.summary,
        issuesFound: row.issues_found,
      },
      actor: ACTOR,
      idempotencyKey: idempotencyKey("inspection_report", row.id, EventTypes.InspectionReportUploaded),
    });
    if (result.deduped) stats.deduped++; else stats.reports++;
  }
}

async function backfillNotificationPrefs(tx: DrizzleTx, homeMap: Map<number, string>, stats: BackfillStats): Promise<void> {
  const rows = await tx.execute(sql`SELECT * FROM notification_preferences ORDER BY id`);

  for (const row of rows.rows as any[]) {
    const home = await tx.execute(sql`SELECT id FROM homes WHERE user_id = ${row.user_id} LIMIT 1`);
    if (home.rows.length === 0) continue;

    const homeUuid = homeMap.get((home.rows[0] as any).id);
    if (!homeUuid) continue;

    const prefs: Record<string, unknown> = {};
    for (const key of ["email_enabled", "push_enabled", "sms_enabled",
      "task_reminders", "inspection_alerts", "maintenance_tips", "budget_alerts"]) {
      if (row[key] != null) prefs[key] = row[key];
    }

    const result = await appendAndApply(tx, {
      aggregateType: "notification_pref",
      aggregateId: homeUuid,
      expectedVersion: 0,
      eventType: EventTypes.NotificationPreferenceSet,
      data: { prefs },
      meta: { source: "backfill", legacyId: row.id, userId: row.user_id },
      actor: ACTOR,
      idempotencyKey: idempotencyKey("notification_pref", row.id, EventTypes.NotificationPreferenceSet),
    });
    if (result.deduped) stats.deduped++; else stats.notificationPrefs++;
  }
}

async function backfillChat(tx: DrizzleTx, homeMap: Map<number, string>, stats: BackfillStats): Promise<void> {
  const homeIds = await tx.execute(sql`SELECT DISTINCT home_id FROM chat_messages ORDER BY home_id`);
  const sessionVersions = new Map<string, number>();

  for (const homeRow of homeIds.rows as any[]) {
    const homeUuid = homeMap.get(homeRow.home_id);
    if (!homeUuid) continue;

    const sessionUuid = deterministicUuid("chat_session", homeRow.home_id);

    const sessionResult = await appendAndApply(tx, {
      aggregateType: "chat_session",
      aggregateId: sessionUuid,
      expectedVersion: 0,
      eventType: EventTypes.ChatSessionCreated,
      data: { homeId: homeUuid },
      meta: { source: "backfill" },
      actor: ACTOR,
      idempotencyKey: idempotencyKey("chat_session", homeRow.home_id, EventTypes.ChatSessionCreated),
    });
    if (sessionResult.deduped) {
      stats.deduped++;
      sessionVersions.set(sessionUuid, sessionResult.version);
    } else {
      stats.chatSessions++;
      sessionVersions.set(sessionUuid, sessionResult.version);
    }

    const messages = await tx.execute(
      sql`SELECT * FROM chat_messages WHERE home_id = ${homeRow.home_id} ORDER BY created_at, id`
    );

    let seq = 0;
    for (const msg of messages.rows as any[]) {
      seq++;
      const messageUuid = deterministicUuid("chat_message", msg.id);
      const currentVersion = sessionVersions.get(sessionUuid) ?? 0;

      const msgMeta: Record<string, unknown> = { source: "backfill", legacyId: msg.id };
      if (msg.image_type) msgMeta.imageType = msg.image_type;
      if (msg.image_data) msgMeta.hasImage = true;
      if (msg.model) msgMeta.model = msg.model;
      if (msg.prompt_tokens != null) msgMeta.promptTokens = msg.prompt_tokens;
      if (msg.completion_tokens != null) msgMeta.completionTokens = msg.completion_tokens;

      const msgResult = await appendAndApply(tx, {
        aggregateType: "chat_session",
        aggregateId: sessionUuid,
        expectedVersion: currentVersion,
        eventType: EventTypes.ChatMessageSent,
        data: {
          messageId: messageUuid,
          seq,
          role: msg.role,
          content: msg.content,
        },
        meta: msgMeta,
        actor: ACTOR,
        idempotencyKey: idempotencyKey("chat_message", msg.id, EventTypes.ChatMessageSent),
      });
      if (msgResult.deduped) {
        stats.deduped++;
        sessionVersions.set(sessionUuid, msgResult.version);
      } else {
        stats.chatMessages++;
        sessionVersions.set(sessionUuid, msgResult.version);
      }
    }
  }
}

async function getDryCounts(): Promise<Record<string, number>> {
  const tables = ["homes", "systems", "maintenance_tasks", "inspection_reports",
    "notification_preferences", "chat_messages"];
  const counts: Record<string, number> = {};

  for (const table of tables) {
    const result = await db.execute(sql.raw(`SELECT COUNT(*)::int AS c FROM ${table}`));
    counts[table] = (result.rows[0] as any).c;
  }

  const sessions = await db.execute(sql`SELECT COUNT(DISTINCT home_id)::int AS c FROM chat_messages`);
  counts["chat_sessions_planned"] = (sessions.rows[0] as any).c;

  const completed = await db.execute(sql`SELECT COUNT(*)::int AS c FROM maintenance_tasks WHERE status = 'completed'`);
  counts["tasks_with_completion_events"] = (completed.rows[0] as any).c;

  return counts;
}

export async function runBackfill(dryRun: boolean): Promise<BackfillStats | null> {
  console.log(`[backfill] Starting backfill (dry-run: ${dryRun})`);

  if (dryRun) {
    const counts = await getDryCounts();
    console.log("[backfill] Dry-run — planned event counts:");
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table}: ${count}`);
    }
    console.log("[backfill] No events written. Re-run without --dry-run to execute.");
    return null;
  }

  const stats: BackfillStats = {
    homes: 0,
    systems: 0,
    tasks: 0,
    taskCompleted: 0,
    reports: 0,
    chatSessions: 0,
    chatMessages: 0,
    notificationPrefs: 0,
    deduped: 0,
  };

  await db.transaction(async (tx) => {
    console.log("[backfill] Phase 1: Backfilling homes...");
    const homeMap = await backfillHomes(tx, stats);
    console.log(`[backfill]   ${stats.homes} homes imported`);

    console.log("[backfill] Phase 2: Backfilling systems...");
    const systemMap = await backfillSystems(tx, homeMap, stats);
    console.log(`[backfill]   ${stats.systems} systems imported`);

    console.log("[backfill] Phase 3: Backfilling tasks...");
    await backfillTasks(tx, homeMap, systemMap, stats);
    console.log(`[backfill]   ${stats.tasks} tasks created, ${stats.taskCompleted} completed`);

    console.log("[backfill] Phase 4: Backfilling inspection reports...");
    await backfillReports(tx, homeMap, stats);
    console.log(`[backfill]   ${stats.reports} reports imported`);

    console.log("[backfill] Phase 5: Backfilling notification preferences...");
    await backfillNotificationPrefs(tx, homeMap, stats);
    console.log(`[backfill]   ${stats.notificationPrefs} prefs imported`);

    console.log("[backfill] Phase 6: Backfilling chat...");
    await backfillChat(tx, homeMap, stats);
    console.log(`[backfill]   ${stats.chatSessions} sessions, ${stats.chatMessages} messages imported`);
  });

  console.log(`[backfill] Deduped (idempotent skips): ${stats.deduped}`);
  console.log("[backfill] Backfill complete. Rebuilding projections...");
  const rebuildResult = await rebuildAll(0);
  console.log(`[backfill] Projection rebuild complete: ${rebuildResult.processed} events processed`);

  return stats;
}

if (require.main === module || process.argv[1]?.includes("backfill")) {
  const dryRun = process.argv.includes("--dry-run");
  runBackfill(dryRun)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[backfill] Fatal error:", err);
      process.exit(1);
    });
}
