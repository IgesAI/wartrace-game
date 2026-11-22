-- Defense-in-depth invariants that the application also enforces.
CREATE OR REPLACE FUNCTION wartrace_reject_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'WARTRACE_IMMUTABLE: % on % is not permitted', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER operation_snapshots_immutable BEFORE UPDATE OR DELETE ON operation_snapshots
  FOR EACH ROW EXECUTE FUNCTION wartrace_reject_mutation();
--> statement-breakpoint
CREATE TRIGGER editorial_audit_logs_append_only BEFORE UPDATE OR DELETE ON editorial_audit_logs
  FOR EACH ROW EXECUTE FUNCTION wartrace_reject_mutation();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION wartrace_locked_round_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' OR OLD.locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'WARTRACE_IMMUTABLE: locked round % cannot change', OLD.id;
  END IF;
  IF NEW.opened_at <> OLD.opened_at OR NEW.deadline_at <> OLD.deadline_at OR NEW.question_version_id <> OLD.question_version_id THEN
    RAISE EXCEPTION 'WARTRACE_IMMUTABLE: round timing/question cannot change';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER run_rounds_lock_guard BEFORE UPDATE OR DELETE ON run_rounds
  FOR EACH ROW EXECUTE FUNCTION wartrace_locked_round_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION wartrace_published_operation_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.publication_timestamp IS NOT NULL THEN
      RAISE EXCEPTION 'WARTRACE_IMMUTABLE: published operation % cannot be deleted', OLD.id;
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.publication_timestamp IS NOT NULL THEN
    IF NEW.date_key <> OLD.date_key OR NEW.version <> OLD.version OR NEW.title <> OLD.title
       OR NEW.blurb <> OLD.blurb OR NEW.score_version_id <> OLD.score_version_id
       OR NEW.content_checksum IS DISTINCT FROM OLD.content_checksum
       OR NEW.content_class IS DISTINCT FROM OLD.content_class
       OR NEW.publication_timestamp IS DISTINCT FROM OLD.publication_timestamp THEN
      RAISE EXCEPTION 'WARTRACE_IMMUTABLE: published operation % content is frozen', OLD.id;
    END IF;
    IF NEW.status NOT IN ('published','retired','disabled') THEN
      RAISE EXCEPTION 'WARTRACE_IMMUTABLE: published operation cannot return to %', NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER daily_operations_published_guard BEFORE UPDATE OR DELETE ON daily_operations
  FOR EACH ROW EXECUTE FUNCTION wartrace_published_operation_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION wartrace_operation_questions_guard() RETURNS trigger AS $$
DECLARE
  op uuid;
BEGIN
  op := COALESCE(NEW.operation_id, OLD.operation_id);
  IF EXISTS (SELECT 1 FROM operation_snapshots s WHERE s.operation_id = op)
     OR (TG_OP <> 'INSERT' AND EXISTS (SELECT 1 FROM operation_snapshots s WHERE s.operation_id = OLD.operation_id)) THEN
    RAISE EXCEPTION 'WARTRACE_IMMUTABLE: operation % questions are frozen', op;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER operation_questions_frozen BEFORE INSERT OR UPDATE OR DELETE ON operation_questions
  FOR EACH ROW EXECUTE FUNCTION wartrace_operation_questions_guard();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION wartrace_published_question_guard() RETURNS trigger AS $$
DECLARE
  qv uuid;
BEGIN
  qv := COALESCE(NEW.question_version_id, OLD.question_version_id);
  IF EXISTS (SELECT 1 FROM question_versions q WHERE q.id = qv AND q.editorial_status IN ('published','retired')) THEN
    RAISE EXCEPTION 'WARTRACE_IMMUTABLE: question version % is published; create a new version', qv;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER question_eligible_entities_frozen BEFORE INSERT OR UPDATE OR DELETE ON question_eligible_entities
  FOR EACH ROW EXECUTE FUNCTION wartrace_published_question_guard();
--> statement-breakpoint
CREATE TRIGGER question_answer_aliases_frozen BEFORE INSERT OR UPDATE OR DELETE ON question_answer_aliases
  FOR EACH ROW EXECUTE FUNCTION wartrace_published_question_guard();
