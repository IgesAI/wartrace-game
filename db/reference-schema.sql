-- WARTRACE proposed PostgreSQL DDL, v1 handoff reference.
-- Agent: migrate through Drizzle; don't apply unchanged to production without review.
-- Historical eligibility/rights use multiple tables; schema assumes trusted server validation.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  privacy_opt_out boolean NOT NULL DEFAULT false
);

CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text UNIQUE NOT NULL,
  email text UNIQUE,
  role text NOT NULL CHECK (role IN ('reader','editor','reviewer','publisher','owner')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE historical_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  entity_type text NOT NULL,
  wikidata_qid text UNIQUE,
  start_date text,
  end_date text,
  disambiguation text,
  editorial_status text NOT NULL DEFAULT 'candidate'
    CHECK (editorial_status IN ('candidate','corroborated','reviewed','disputed','retracted')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES historical_entities(id),
  alias text NOT NULL,
  normalized_alias text NOT NULL,
  language_code text NOT NULL DEFAULT 'en',
  alias_status text NOT NULL DEFAULT 'candidate'
    CHECK (alias_status IN ('candidate','approved','rejected')),
  reviewed_by uuid REFERENCES admin_users(id),
  UNIQUE (entity_id, normalized_alias, language_code)
);
CREATE INDEX entity_alias_lookup ON entity_aliases(normalized_alias) WHERE alias_status='approved';

CREATE TABLE evidence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  source_record_id text,
  source_url text NOT NULL,
  title text NOT NULL,
  publisher text,
  retrieved_at timestamptz NOT NULL,
  publication_date text,
  query_hash text,
  source_tier text NOT NULL CHECK (source_tier IN ('A','B','C','D')),
  rights_statement text,
  license_code text,
  review_status text NOT NULL DEFAULT 'candidate'
    CHECK (review_status IN ('candidate','corroborated','reviewed','rejected')),
  reviewed_by uuid REFERENCES admin_users(id),
  UNIQUE(provider,source_url)
);

CREATE TABLE entity_evidence (
  entity_id uuid NOT NULL REFERENCES historical_entities(id),
  evidence_id uuid NOT NULL REFERENCES evidence_sources(id),
  claim_summary text NOT NULL,
  claim_status text NOT NULL DEFAULT 'candidate'
    CHECK (claim_status IN ('candidate','reviewed','disputed','retracted')),
  PRIMARY KEY (entity_id, evidence_id)
);

CREATE TABLE question_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_family_key text NOT NULL,
  version integer NOT NULL CHECK (version >= 1),
  prompt text NOT NULL,
  internal_eligibility_rules text NOT NULL,
  internal_exclusion_rules text NOT NULL DEFAULT '',
  topic text NOT NULL,
  coverage_class text NOT NULL DEFAULT 'experimental_not_publishable'
    CHECK (coverage_class IN ('finite_certified','broad_reviewed','experimental_not_publishable')),
  editorial_status text NOT NULL DEFAULT 'draft'
    CHECK (editorial_status IN ('draft','review','approved','published','disputed','retired')),
  created_by uuid REFERENCES admin_users(id),
  reviewed_by uuid REFERENCES admin_users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(question_family_key, version)
);

CREATE TABLE question_eligible_entities (
  question_version_id uuid NOT NULL REFERENCES question_versions(id),
  entity_id uuid NOT NULL REFERENCES historical_entities(id),
  rarity_score numeric(7,6) NOT NULL CHECK (rarity_score BETWEEN 0 AND 1),
  inclusion_rationale text NOT NULL,
  evidence_status text NOT NULL DEFAULT 'candidate'
    CHECK (evidence_status IN ('candidate','reviewed','disputed','retracted')),
  approved_by uuid REFERENCES admin_users(id),
  PRIMARY KEY (question_version_id, entity_id)
);

-- The one-alias-to-one-entity-per-question constraint is deliberate.
-- Admin must detect collisions before insert and show an ambiguity review UI.
CREATE TABLE question_answer_aliases (
  question_version_id uuid NOT NULL,
  entity_id uuid NOT NULL,
  normalized_alias text NOT NULL,
  display_alias text NOT NULL,
  PRIMARY KEY(question_version_id, normalized_alias),
  FOREIGN KEY(question_version_id, entity_id)
    REFERENCES question_eligible_entities(question_version_id, entity_id)
);

CREATE TABLE scoring_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL UNIQUE,
  algorithm text NOT NULL,
  parameters jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  frozen_at timestamptz
);

CREATE TABLE daily_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key date NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version >= 1),
  title text NOT NULL,
  blurb text NOT NULL,
  scene_key text NOT NULL,
  score_version_id uuid NOT NULL REFERENCES scoring_versions(id),
  status text NOT NULL DEFAULT 'draft'
    CHECK(status IN ('draft','review','approved','published','retired','disabled')),
  content_checksum text,
  publication_timestamp timestamptz,
  created_by uuid REFERENCES admin_users(id),
  approved_by uuid REFERENCES admin_users(id),
  UNIQUE(date_key,version)
);
CREATE UNIQUE INDEX one_active_daily ON daily_operations(date_key)
  WHERE status='published';

CREATE TABLE operation_questions (
  operation_id uuid NOT NULL REFERENCES daily_operations(id),
  round_index smallint NOT NULL CHECK(round_index BETWEEN 1 AND 7),
  question_version_id uuid NOT NULL REFERENCES question_versions(id),
  PRIMARY KEY(operation_id,round_index),
  UNIQUE(operation_id,question_version_id)
);

CREATE TABLE game_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES daily_operations(id),
  guest_session_id uuid NOT NULL REFERENCES guest_sessions(id),
  operation_version integer NOT NULL,
  state text NOT NULL DEFAULT 'created'
    CHECK(state IN ('created','active','completed','invalidated')),
  current_round smallint NOT NULL DEFAULT 1 CHECK(current_round BETWEEN 1 AND 8),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_score integer NOT NULL DEFAULT 0 CHECK(total_score BETWEEN 0 AND 7000),
  total_distance_m integer NOT NULL DEFAULT 0 CHECK(total_distance_m BETWEEN 0 AND 5600),
  UNIQUE(operation_id,guest_session_id)
);

CREATE TABLE run_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES game_runs(id),
  round_index smallint NOT NULL CHECK(round_index BETWEEN 1 AND 7),
  question_version_id uuid NOT NULL REFERENCES question_versions(id),
  opened_at timestamptz NOT NULL,
  deadline_at timestamptz NOT NULL,
  locked_at timestamptz,
  outcome text CHECK(outcome IN ('valid','invalid','timed_out')),
  chosen_entity_id uuid REFERENCES historical_entities(id),
  normalized_input_hash text,
  points integer CHECK(points BETWEEN 0 AND 1000),
  distance_m integer CHECK(distance_m BETWEEN 0 AND 800),
  rarity_tier text,
  idempotency_key uuid,
  UNIQUE(run_id,round_index),
  UNIQUE(run_id,idempotency_key),
  CHECK(deadline_at > opened_at),
  CHECK((locked_at IS NULL AND outcome IS NULL) OR (locked_at IS NOT NULL AND outcome IS NOT NULL))
);

CREATE TABLE public_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL UNIQUE REFERENCES game_runs(id),
  share_token text NOT NULL UNIQUE,
  display_name text,
  share_consent boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE answer_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id uuid REFERENCES guest_sessions(id),
  run_round_id uuid REFERENCES run_rounds(id),
  submitted_text text NOT NULL,
  evidence_url text,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK(status IN ('new','triage','valid_missing','invalid','ambiguous','needs_research','closed')),
  reviewer_id uuid REFERENCES admin_users(id),
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE licensed_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_key text NOT NULL UNIQUE,
  original_url text,
  creator text,
  license_code text NOT NULL,
  rights_statement text NOT NULL,
  attribution_line text,
  sha256 text NOT NULL,
  status text NOT NULL DEFAULT 'candidate'
    CHECK(status IN ('candidate','approved','rejected')),
  reviewed_by uuid REFERENCES admin_users(id)
);

CREATE TABLE editorial_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES admin_users(id),
  action text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  date_key date,
  anonymous_session_bucket text,
  event_properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX daily_lookup ON daily_operations(date_key,status);
CREATE INDEX open_round_lookup ON run_rounds(run_id,round_index);
CREATE INDEX appeal_triage ON answer_appeals(status,created_at);
CREATE INDEX editorial_action_lookup ON editorial_audit_logs(subject_type,subject_id,created_at DESC);

-- MUST IMPLEMENT IN APPLICATION OR DB TRIGGERS:
-- (1) Immutable published question/answer/rarity snapshots; (2) exactly 7 questions
-- per published operation; (3) only reviewed A/B evidence makes accepted answers
-- publishable; (4) all round totals computed server-side and locked; (5) entity/
-- alias display privacy, source-rights checks and actor role enforcement.
-- This reference schema does not by itself guarantee those invariants.
