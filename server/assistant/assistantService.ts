/**
 * Assistant Service — Core gating logic for assistant actions.
 *
 * Enforces the propose → approve → execute lifecycle with explicit
 * approval gates. No assistant-proposed command can run without
 * human approval. Every step is recorded as a domain event with
 * provenance and correlation metadata for full traceability.
 */

import { sql } from "drizzle-orm";
import crypto from "crypto";
import { append, getCurrentVersion } from "../eventing/eventStore";
import { applyEvent } from "../projections/applyEvent";
import { EventTypes, type Actor, type AppendEventInput } from "../eventing/types";
import { validateTransition, TransitionError } from "../domain/stateMachine";

type Tx = Parameters<Parameters<typeof import("../db").db.transaction>[0]>[0];

// ---------------------------------------------------------------------------
// Internal: transactional append + projection apply
// ---------------------------------------------------------------------------
async function appendAndApply(tx: Tx, input: Parameters<typeof append>[1]) {
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
      session_id: input.sessionId,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Internal: guarded append — validates state machine before appending
// ---------------------------------------------------------------------------
async function getAggregateState(tx: Tx, aggregateType: string, aggregateId: string): Promise<string | null> {
  if (aggregateType === "assistant_action") {
    const r = await tx.execute(sql`SELECT state FROM projection_assistant_action WHERE assistant_action_id = ${aggregateId}`);
    return r.rows.length ? (r.rows[0] as { state: string }).state : null;
  }
  return null;
}

async function guardedAppendAndApply(tx: Tx, input: AppendEventInput) {
  const currentState = await getAggregateState(tx, input.aggregateType, input.aggregateId);
  validateTransition(input.aggregateType, input.aggregateId, currentState, input.eventType);
  return appendAndApply(tx, input);
}

// ---------------------------------------------------------------------------
// Propose — assistant suggests an action with provenance metadata
// ---------------------------------------------------------------------------
export interface ProposeInput {
  homeId: string;
  proposedCommands: Array<Record<string, unknown>>;
  confidence?: number;
  rationale?: string;
}

export async function proposeAction(
  tx: Tx,
  input: ProposeInput,
  actor: Actor,
  idempotencyKey: string,
) {
  const actionId = crypto.randomUUID();
  const result = await appendAndApply(tx, {
    aggregateType: "assistant_action",
    aggregateId: actionId,
    expectedVersion: 0,
    eventType: EventTypes.AssistantActionProposed,
    data: {
      homeId: input.homeId,
      proposedCommands: input.proposedCommands,
      confidence: input.confidence,
      rationale: input.rationale,
    },
    meta: {},
    actor,
    idempotencyKey,
  });
  return { assistantActionId: actionId, ...result };
}

// ---------------------------------------------------------------------------
// Approve + Execute — gate on 'proposed' state, run proposed commands
// ---------------------------------------------------------------------------
export interface ApproveResult {
  assistantActionId: string;
  effects: Array<Record<string, unknown>>;
  eventIds: string[];
}

export async function approveAndExecute(
  tx: Tx,
  assistantActionId: string,
  actor: Actor,
  idempotencyKey: string,
): Promise<ApproveResult> {
  const row = await tx.execute(sql`
    SELECT proposed_commands, provenance
    FROM projection_assistant_action
    WHERE assistant_action_id = ${assistantActionId}
  `);
  if (row.rows.length === 0) {
    throw Object.assign(new Error("Assistant action not found"), { status: 404 });
  }
  const action = row.rows[0] as { proposed_commands: unknown[]; provenance: Record<string, unknown> };

  const ver = await getCurrentVersion(tx, "assistant_action", assistantActionId);

  // 1) Guarded approve — validates state='proposed' via state machine
  const approveResult = await guardedAppendAndApply(tx, {
    aggregateType: "assistant_action",
    aggregateId: assistantActionId,
    expectedVersion: ver,
    eventType: EventTypes.AssistantActionApproved,
    data: { approvedBy: actor.actorId },
    meta: {},
    actor,
    idempotencyKey: `${idempotencyKey}-approve`,
  });

  // 2) Execute proposed commands — emit domain events for each
  const effects: Array<Record<string, unknown>> = [];
  const eventIds: string[] = [];
  const commands = action.proposed_commands as Array<Record<string, unknown>>;

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];
    const cmdResult = await appendAndApply(tx, {
      aggregateType: (cmd.aggregateType as string) ?? "task",
      aggregateId: (cmd.aggregateId as string) ?? crypto.randomUUID(),
      expectedVersion: (cmd.expectedVersion as number) ?? 0,
      eventType: (cmd.eventType as string) ?? EventTypes.TaskCreated,
      data: cmd.data ?? {},
      meta: { fromAssistantAction: assistantActionId },
      actor: { actorType: "assistant", actorId: "assistant" },
      idempotencyKey: `${idempotencyKey}-cmd-${i}`,
      correlationId: approveResult.eventId,
    });
    effects.push({ command: cmd, result: cmdResult });
    eventIds.push(cmdResult.eventId);
  }

  // 3) Append AssistantActionExecuted — links back via correlationId
  await appendAndApply(tx, {
    aggregateType: "assistant_action",
    aggregateId: assistantActionId,
    expectedVersion: approveResult.version,
    eventType: EventTypes.AssistantActionExecuted,
    data: { effects, eventIds },
    meta: {},
    actor,
    idempotencyKey: `${idempotencyKey}-execute`,
    correlationId: approveResult.eventId,
  });

  return { assistantActionId, effects, eventIds };
}

// ---------------------------------------------------------------------------
// Reject — gate on 'proposed' state, mark action as rejected
// ---------------------------------------------------------------------------
export async function rejectAction(
  tx: Tx,
  assistantActionId: string,
  reason: string | undefined,
  actor: Actor,
  idempotencyKey: string,
) {
  const row = await tx.execute(sql`
    SELECT assistant_action_id FROM projection_assistant_action
    WHERE assistant_action_id = ${assistantActionId}
  `);
  if (row.rows.length === 0) {
    throw Object.assign(new Error("Assistant action not found"), { status: 404 });
  }

  const ver = await getCurrentVersion(tx, "assistant_action", assistantActionId);
  return guardedAppendAndApply(tx, {
    aggregateType: "assistant_action",
    aggregateId: assistantActionId,
    expectedVersion: ver,
    eventType: EventTypes.AssistantActionRejected,
    data: { reason },
    meta: {},
    actor,
    idempotencyKey,
  });
}

// ---------------------------------------------------------------------------
// Query — fetch single action or list by homeId
// ---------------------------------------------------------------------------
export interface AssistantActionView {
  assistantActionId: string;
  homeId: string;
  state: string;
  proposedCommands: unknown[];
  provenance: Record<string, unknown>;
  updatedAt: string;
}

export async function getAction(tx: Tx, assistantActionId: string): Promise<AssistantActionView | null> {
  const row = await tx.execute(sql`
    SELECT assistant_action_id, home_id, state, proposed_commands, provenance, updated_at
    FROM projection_assistant_action
    WHERE assistant_action_id = ${assistantActionId}
  `);
  if (row.rows.length === 0) return null;
  const r = row.rows[0] as Record<string, unknown>;
  const updatedAt = r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at);
  return {
    assistantActionId: r.assistant_action_id as string,
    homeId: r.home_id as string,
    state: r.state as string,
    proposedCommands: r.proposed_commands as unknown[],
    provenance: r.provenance as Record<string, unknown>,
    updatedAt,
  };
}

export async function listActionsByHome(tx: Tx, homeId: string): Promise<AssistantActionView[]> {
  const rows = await tx.execute(sql`
    SELECT assistant_action_id, home_id, state, proposed_commands, provenance, updated_at
    FROM projection_assistant_action
    WHERE home_id = ${homeId}
    ORDER BY updated_at DESC
  `);
  return rows.rows.map((r: Record<string, unknown>) => {
    const updatedAt = r.updated_at instanceof Date ? (r.updated_at as Date).toISOString() : String(r.updated_at);
    return {
      assistantActionId: r.assistant_action_id as string,
      homeId: r.home_id as string,
      state: r.state as string,
      proposedCommands: r.proposed_commands as unknown[],
      provenance: r.provenance as Record<string, unknown>,
      updatedAt,
    };
  });
}
