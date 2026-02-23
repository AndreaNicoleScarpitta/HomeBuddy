/**
 * Event Sourcing Schema — Milestone 1: Event Log Foundation
 *
 * This module defines the core tables for the state-machine + immutable event log
 * architecture.  Every meaningful state change in the application is recorded as an
 * append-only event in `event_log`.  Projection tables (read models) are derived
 * from these events to serve the existing UX with consistent, current-state views.
 *
 * Key correctness primitives:
 *   - Idempotency:  UNIQUE(actor_id, idempotency_key) prevents duplicate writes.
 *   - Optimistic concurrency:  UNIQUE(aggregate_type, aggregate_id, aggregate_version)
 *     rejects conflicting updates deterministically.
 *   - Immutability:  A database trigger prevents UPDATE/DELETE on event_log rows.
 *
 * See: attached_assets/Home_Buddy_state-machine_+_immutable_event_log_backend_replace.pdf
 */

import {
  pgTable,
  uuid,
  bigint,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Actor types — who originated an event
// ---------------------------------------------------------------------------
export const actorTypes = ["user", "assistant", "system"] as const;
export type ActorType = (typeof actorTypes)[number];

// ---------------------------------------------------------------------------
// event_log — append-only, immutable event store
//
// Each row captures a single domain event with its full envelope: ordering key,
// aggregate identity, actor, correlation/causation chain, and a flexible JSONB
// payload + metadata.
// ---------------------------------------------------------------------------
export const eventLog = pgTable(
  "event_log",
  {
    /** Monotonically increasing ordering key (never gaps, never reused). */
    eventSeq: bigint("event_seq", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    /** Globally unique event identifier. */
    eventId: uuid("event_id").notNull().defaultRandom(),

    /** Aggregate stream identity — e.g. "inspection_report", "task". */
    aggregateType: text("aggregate_type").notNull(),

    /** Aggregate instance — UUID of the entity this event belongs to. */
    aggregateId: uuid("aggregate_id").notNull(),

    /** Per-aggregate version counter for optimistic concurrency. */
    aggregateVersion: integer("aggregate_version").notNull(),

    /** Domain event name — e.g. "InspectionReportUploaded". */
    eventType: text("event_type").notNull(),

    /** Schema version of the `data` payload (for forward-compatible evolution). */
    eventSchemaVersion: integer("event_schema_version").notNull().default(1),

    /** When the event occurred (wall-clock, with time zone). */
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /** Who caused this event: "user" | "assistant" | "system". */
    actorType: text("actor_type").notNull(),

    /** Identifier of the actor (user ID, "system", assistant action ID, etc.). */
    actorId: text("actor_id").notNull(),

    /**
     * Caller-supplied idempotency token scoped to the actor.
     * Combined with actor_id in a partial unique index to prevent duplicate writes.
     */
    idempotencyKey: text("idempotency_key"),

    /** Shared identifier linking causally related events across aggregates. */
    correlationId: uuid("correlation_id"),

    /** Identifier of the event that directly caused this one. */
    causationId: uuid("causation_id"),

    /** Chat / interaction session this event belongs to (nullable). */
    sessionId: uuid("session_id"),

    /** Domain-specific event payload (varies by eventType). */
    data: jsonb("data").notNull().default({}),

    /**
     * Operational metadata: provenance, confidence scores, model versions,
     * source references, etc.
     */
    meta: jsonb("meta").notNull().default({}),
  },
  (table) => [
    // Optimistic concurrency — reject conflicting writes to the same aggregate
    uniqueIndex("event_log_aggregate_version_uq").on(
      table.aggregateType,
      table.aggregateId,
      table.aggregateVersion,
    ),

    // Idempotency — prevent duplicate events from the same actor
    uniqueIndex("event_log_idempotency_uq")
      .on(table.actorId, table.idempotencyKey)
      .where(sql`idempotency_key IS NOT NULL`),

    // Fast lookups by aggregate stream
    index("event_log_aggregate_stream_idx").on(
      table.aggregateType,
      table.aggregateId,
    ),

    // Global ordering scan
    index("event_log_seq_idx").on(table.eventSeq),
  ],
);

/** Insert schema for event_log (omits auto-generated fields). */
export const insertEventLogSchema = createInsertSchema(eventLog);
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type EventLogRow = typeof eventLog.$inferSelect;

// ---------------------------------------------------------------------------
// Projection tables — derived read models kept in sync with event_log
//
// Each projection stores the "current state" for a single aggregate, derived
// by applying events in order.  The `last_event_seq` column tracks the most
// recent event that was applied, enabling catch-up / rebuild.
// ---------------------------------------------------------------------------

/** Projection: Home aggregate current state. */
export const projectionHome = pgTable("projection_home", {
  homeId: text("home_id").primaryKey(),
  attrs: jsonb("attrs").notNull().default({}),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionHome = typeof projectionHome.$inferSelect;

/** Projection: System aggregate current state (health, risk, overrides). */
export const projectionSystem = pgTable("projection_system", {
  systemId: text("system_id").primaryKey(),
  homeId: text("home_id").notNull(),
  systemType: text("system_type"),
  attrs: jsonb("attrs").notNull().default({}),
  healthState: text("health_state"),
  riskScore: integer("risk_score"),
  override: jsonb("override"),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionSystem = typeof projectionSystem.$inferSelect;

/** Projection: InspectionReport processing state and analysis artifacts. */
export const projectionReport = pgTable("projection_report", {
  reportId: text("report_id").primaryKey(),
  homeId: text("home_id").notNull(),
  state: text("state").notNull().default("created"),
  fileHash: text("file_hash"),
  storageRef: text("storage_ref"),
  draft: jsonb("draft"),
  published: jsonb("published"),
  error: jsonb("error"),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionReport = typeof projectionReport.$inferSelect;

/** Projection: Individual finding from an inspection report. */
export const projectionFinding = pgTable("projection_finding", {
  findingId: text("finding_id").primaryKey(),
  reportId: text("report_id").notNull(),
  homeId: text("home_id").notNull(),
  systemId: text("system_id"),
  state: text("state").notNull().default("draft"),
  card: jsonb("card").notNull().default({}),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionFinding = typeof projectionFinding.$inferSelect;

/** Projection: Task lifecycle current state. */
export const projectionTask = pgTable("projection_task", {
  taskId: text("task_id").primaryKey(),
  homeId: text("home_id").notNull(),
  systemId: text("system_id"),
  state: text("state").notNull().default("proposed"),
  title: text("title"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  estimates: jsonb("estimates"),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionTask = typeof projectionTask.$inferSelect;

/** Projection: User notification preferences. */
export const projectionNotificationPref = pgTable("projection_notification_pref", {
  homeId: text("home_id").primaryKey(),
  prefs: jsonb("prefs").notNull().default({}),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionNotificationPref = typeof projectionNotificationPref.$inferSelect;

/** Projection: Assistant action propose/approve/execute lifecycle. */
export const projectionAssistantAction = pgTable("projection_assistant_action", {
  assistantActionId: text("assistant_action_id").primaryKey(),
  homeId: text("home_id").notNull(),
  state: text("state").notNull().default("proposed"),
  proposedCommands: jsonb("proposed_commands"),
  provenance: jsonb("provenance"),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionAssistantAction = typeof projectionAssistantAction.$inferSelect;

/** Projection: Chat session header (one per conversation). */
export const projectionChatSession = pgTable("projection_chat_session", {
  sessionId: text("session_id").primaryKey(),
  homeId: text("home_id").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
});
export type ProjectionChatSession = typeof projectionChatSession.$inferSelect;

/** Projection: Individual chat message within a session. */
export const projectionChatMessage = pgTable(
  "projection_chat_message",
  {
    messageId: text("message_id").primaryKey(),
    sessionId: text("session_id").notNull(),
    seq: integer("seq").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("projection_chat_message_session_idx").on(table.sessionId),
  ],
);
export type ProjectionChatMessage = typeof projectionChatMessage.$inferSelect;

/** Projection: Circuit panel map — breaker annotations for a home's electrical system. */
export const projectionCircuitMap = pgTable("projection_circuit_map", {
  mapId: text("map_id").primaryKey(),
  homeId: text("home_id").notNull(),
  systemId: text("system_id"),
  imageUrl: text("image_url"),
  storeImage: integer("store_image").notNull().default(0),
  state: text("state").notNull().default("idle"),
  breakers: jsonb("breakers").notNull().default([]),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ProjectionCircuitMap = typeof projectionCircuitMap.$inferSelect;

/**
 * Projection checkpoint — tracks how far each projector has consumed the
 * event_log.  Used by the catch-up / rebuild loop so it can resume from
 * where it left off.
 */
export const projectionCheckpoint = pgTable("projection_checkpoint", {
  projectorName: text("projector_name").primaryKey(),
  lastEventSeq: bigint("last_event_seq", { mode: "number" }).notNull().default(0),
});
export type ProjectionCheckpoint = typeof projectionCheckpoint.$inferSelect;

// ---------------------------------------------------------------------------
// job_queue — Postgres-backed background job table
//
// Workers use SELECT ... FOR UPDATE SKIP LOCKED to claim jobs without
// duplicating work.  No external queue (Redis, etc.) required.
// ---------------------------------------------------------------------------

/** Job statuses for the Postgres-backed job queue. */
export const jobStatuses = ["pending", "locked", "completed", "failed"] as const;
export type JobStatus = (typeof jobStatuses)[number];

export const jobQueue = pgTable(
  "job_queue",
  {
    /** Unique job identifier. */
    jobId: uuid("job_id").primaryKey().defaultRandom(),

    /** Job type discriminator — e.g. "report_analyze", "digest_generate". */
    jobType: text("job_type").notNull(),

    /** Job-specific payload. */
    payload: jsonb("payload").notNull().default({}),

    /** Earliest time the job should be attempted. */
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),

    /** Number of execution attempts so far. */
    attempts: integer("attempts").notNull().default(0),

    /** Current job status. */
    status: text("status").notNull().default("pending"),

    /** Timestamp when a worker locked this job (null if not locked). */
    lockedAt: timestamp("locked_at", { withTimezone: true }),

    /** Error message from the most recent failed attempt. */
    lastError: text("last_error"),
  },
  (table) => [
    index("job_queue_status_run_after_idx").on(table.status, table.runAfter),
    index("job_queue_type_idx").on(table.jobType),
  ],
);

export const insertJobSchema = createInsertSchema(jobQueue).omit({
  jobId: true,
  attempts: true,
  lockedAt: true,
  lastError: true,
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type JobQueueRow = typeof jobQueue.$inferSelect;
