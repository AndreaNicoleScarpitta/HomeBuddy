-- Migration: Event Log Immutability Trigger
-- Purpose: Prevents UPDATE and DELETE on the event_log table, ensuring
--          events are truly append-only.  This is a critical correctness
--          primitive for the state-machine + immutable event log architecture.

CREATE OR REPLACE FUNCTION event_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'event_log is immutable: % operations are not allowed', TG_OP;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_event_log_immutable ON event_log;
CREATE TRIGGER trg_event_log_immutable
  BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW
  EXECUTE FUNCTION event_log_immutable();
