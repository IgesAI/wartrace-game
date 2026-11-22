CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text NOT NULL,
	"email" text,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_auth_subject_unique" UNIQUE("auth_subject"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email"),
	CONSTRAINT "admin_role_check" CHECK ("admin_users"."role" IN ('reader','editor','reviewer','publisher','owner'))
);
--> statement-breakpoint
CREATE TABLE "answer_appeals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_session_id" uuid,
	"run_round_id" uuid,
	"submitted_text" text NOT NULL,
	"explanation" text NOT NULL,
	"evidence_url" text,
	"category" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"reviewer_id" uuid,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "one_appeal_per_round" UNIQUE("run_round_id"),
	CONSTRAINT "appeal_status_check" CHECK ("answer_appeals"."status" IN ('new','triage','valid_missing','invalid','ambiguous','needs_research','closed'))
);
--> statement-breakpoint
CREATE TABLE "daily_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_key" date NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"blurb" text NOT NULL,
	"scene_key" text NOT NULL,
	"score_version_id" uuid NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"content_class" text,
	"content_checksum" text,
	"publication_timestamp" timestamp with time zone,
	"created_by" uuid,
	"approved_by" uuid,
	CONSTRAINT "operation_date_version" UNIQUE("date_key","version"),
	CONSTRAINT "operation_version_check" CHECK ("daily_operations"."version" >= 1),
	CONSTRAINT "operation_status_check" CHECK ("daily_operations"."status" IN ('draft','review','approved','published','retired','disabled')),
	CONSTRAINT "operation_content_class_check" CHECK ("daily_operations"."content_class" IS NULL OR "daily_operations"."content_class" IN ('verified','demo'))
);
--> statement-breakpoint
CREATE TABLE "editorial_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"normalized_alias" text NOT NULL,
	"language_code" text DEFAULT 'en' NOT NULL,
	"alias_status" text DEFAULT 'candidate' NOT NULL,
	"reviewed_by" uuid,
	CONSTRAINT "entity_alias_unique" UNIQUE("entity_id","normalized_alias","language_code"),
	CONSTRAINT "alias_status_check" CHECK ("entity_aliases"."alias_status" IN ('candidate','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "entity_evidence" (
	"entity_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"claim_summary" text NOT NULL,
	"claim_status" text DEFAULT 'candidate' NOT NULL,
	CONSTRAINT "entity_evidence_entity_id_evidence_id_pk" PRIMARY KEY("entity_id","evidence_id"),
	CONSTRAINT "claim_status_check" CHECK ("entity_evidence"."claim_status" IN ('candidate','reviewed','disputed','retracted'))
);
--> statement-breakpoint
CREATE TABLE "evidence_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"source_record_id" text,
	"source_url" text NOT NULL,
	"title" text NOT NULL,
	"publisher" text,
	"retrieved_at" timestamp with time zone NOT NULL,
	"publication_date" text,
	"query_hash" text,
	"source_tier" text NOT NULL,
	"rights_statement" text,
	"license_code" text,
	"review_status" text DEFAULT 'candidate' NOT NULL,
	"reviewed_by" uuid,
	CONSTRAINT "evidence_provider_url" UNIQUE("provider","source_url"),
	CONSTRAINT "evidence_tier_check" CHECK ("evidence_sources"."source_tier" IN ('A','B','C','D')),
	CONSTRAINT "evidence_review_check" CHECK ("evidence_sources"."review_status" IN ('candidate','corroborated','reviewed','rejected'))
);
--> statement-breakpoint
CREATE TABLE "game_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" uuid NOT NULL,
	"guest_session_id" uuid NOT NULL,
	"operation_version" integer NOT NULL,
	"state" text DEFAULT 'created' NOT NULL,
	"current_round" smallint DEFAULT 1 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"total_score" integer DEFAULT 0 NOT NULL,
	"total_distance_m" integer DEFAULT 0 NOT NULL,
	"referred" boolean DEFAULT false NOT NULL,
	CONSTRAINT "one_run_per_guest_operation" UNIQUE("operation_id","guest_session_id"),
	CONSTRAINT "run_state_check" CHECK ("game_runs"."state" IN ('created','active','completed','invalidated')),
	CONSTRAINT "run_round_range" CHECK ("game_runs"."current_round" BETWEEN 1 AND 8),
	CONSTRAINT "run_score_range" CHECK ("game_runs"."total_score" BETWEEN 0 AND 7000),
	CONSTRAINT "run_distance_range" CHECK ("game_runs"."total_distance_m" BETWEEN 0 AND 5600)
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"secret_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"privacy_opt_out" boolean DEFAULT false NOT NULL,
	CONSTRAINT "guest_sessions_secret_hash_unique" UNIQUE("secret_hash")
);
--> statement-breakpoint
CREATE TABLE "historical_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"wikidata_qid" text,
	"start_date" text,
	"end_date" text,
	"disambiguation" text,
	"summary" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"editorial_status" text DEFAULT 'candidate' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "historical_entities_wikidata_qid_unique" UNIQUE("wikidata_qid"),
	CONSTRAINT "entity_status_check" CHECK ("historical_entities"."editorial_status" IN ('candidate','corroborated','reviewed','disputed','retracted'))
);
--> statement-breakpoint
CREATE TABLE "licensed_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"original_url" text,
	"creator" text,
	"license_code" text NOT NULL,
	"rights_statement" text NOT NULL,
	"attribution_line" text,
	"sha256" text NOT NULL,
	"status" text DEFAULT 'candidate' NOT NULL,
	"reviewed_by" uuid,
	CONSTRAINT "licensed_assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "asset_status_check" CHECK ("licensed_assets"."status" IN ('candidate','approved','rejected'))
);
--> statement-breakpoint
CREATE TABLE "operation_questions" (
	"operation_id" uuid NOT NULL,
	"round_index" smallint NOT NULL,
	"question_version_id" uuid NOT NULL,
	CONSTRAINT "operation_questions_operation_id_round_index_pk" PRIMARY KEY("operation_id","round_index"),
	CONSTRAINT "operation_question_unique" UNIQUE("operation_id","question_version_id"),
	CONSTRAINT "operation_round_check" CHECK ("operation_questions"."round_index" BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE TABLE "operation_snapshots" (
	"operation_id" uuid PRIMARY KEY NOT NULL,
	"snapshot" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"share_token" text NOT NULL,
	"display_name" text,
	"share_consent" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_results_run_id_unique" UNIQUE("run_id"),
	CONSTRAINT "public_results_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "question_answer_aliases" (
	"question_version_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"normalized_alias" text NOT NULL,
	"display_alias" text NOT NULL,
	CONSTRAINT "question_answer_aliases_question_version_id_normalized_alias_pk" PRIMARY KEY("question_version_id","normalized_alias")
);
--> statement-breakpoint
CREATE TABLE "question_eligible_entities" (
	"question_version_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"rarity_score" numeric(7, 6) NOT NULL,
	"inclusion_rationale" text NOT NULL,
	"evidence_status" text DEFAULT 'candidate' NOT NULL,
	"approved_by" uuid,
	CONSTRAINT "question_eligible_entities_question_version_id_entity_id_pk" PRIMARY KEY("question_version_id","entity_id"),
	CONSTRAINT "rarity_range_check" CHECK ("question_eligible_entities"."rarity_score" BETWEEN 0 AND 1),
	CONSTRAINT "eligible_evidence_check" CHECK ("question_eligible_entities"."evidence_status" IN ('candidate','reviewed','disputed','retracted'))
);
--> statement-breakpoint
CREATE TABLE "question_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_family_key" text NOT NULL,
	"version" integer NOT NULL,
	"prompt" text NOT NULL,
	"internal_eligibility_rules" text NOT NULL,
	"internal_exclusion_rules" text DEFAULT '' NOT NULL,
	"topic" text NOT NULL,
	"coverage_class" text DEFAULT 'experimental_not_publishable' NOT NULL,
	"coverage_note" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"editorial_status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"reviewed_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_family_version" UNIQUE("question_family_key","version"),
	CONSTRAINT "question_version_check" CHECK ("question_versions"."version" >= 1),
	CONSTRAINT "coverage_class_check" CHECK ("question_versions"."coverage_class" IN ('finite_certified','broad_reviewed','experimental_not_publishable')),
	CONSTRAINT "question_status_check" CHECK ("question_versions"."editorial_status" IN ('draft','review','approved','published','disputed','retired'))
);
--> statement-breakpoint
CREATE TABLE "run_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"round_index" smallint NOT NULL,
	"question_version_id" uuid NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"locked_at" timestamp with time zone,
	"outcome" text,
	"chosen_entity_id" uuid,
	"submitted_text" text,
	"normalized_input_hash" text,
	"points" integer,
	"distance_m" integer,
	"rarity_tier" text,
	"idempotency_key" uuid,
	"clarifications" smallint DEFAULT 0 NOT NULL,
	"clarification_key" uuid,
	CONSTRAINT "run_round_unique" UNIQUE("run_id","round_index"),
	CONSTRAINT "run_idempotency_unique" UNIQUE("run_id","idempotency_key"),
	CONSTRAINT "round_index_range" CHECK ("run_rounds"."round_index" BETWEEN 1 AND 7),
	CONSTRAINT "round_outcome_check" CHECK ("run_rounds"."outcome" IS NULL OR "run_rounds"."outcome" IN ('valid','invalid','timed_out')),
	CONSTRAINT "round_points_range" CHECK ("run_rounds"."points" IS NULL OR "run_rounds"."points" BETWEEN 0 AND 1000),
	CONSTRAINT "round_distance_range" CHECK ("run_rounds"."distance_m" IS NULL OR "run_rounds"."distance_m" BETWEEN 0 AND 800),
	CONSTRAINT "round_deadline_after_open" CHECK ("run_rounds"."deadline_at" > "run_rounds"."opened_at"),
	CONSTRAINT "round_lock_consistency" CHECK (("run_rounds"."locked_at" IS NULL AND "run_rounds"."outcome" IS NULL) OR ("run_rounds"."locked_at" IS NOT NULL AND "run_rounds"."outcome" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "scoring_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"algorithm" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"frozen_at" timestamp with time zone,
	CONSTRAINT "scoring_versions_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "telemetry_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_name" text NOT NULL,
	"date_key" date,
	"anonymous_session_bucket" text,
	"event_properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answer_appeals" ADD CONSTRAINT "answer_appeals_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_appeals" ADD CONSTRAINT "answer_appeals_run_round_id_run_rounds_id_fk" FOREIGN KEY ("run_round_id") REFERENCES "public"."run_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_appeals" ADD CONSTRAINT "answer_appeals_reviewer_id_admin_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_operations" ADD CONSTRAINT "daily_operations_score_version_id_scoring_versions_id_fk" FOREIGN KEY ("score_version_id") REFERENCES "public"."scoring_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_operations" ADD CONSTRAINT "daily_operations_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_operations" ADD CONSTRAINT "daily_operations_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editorial_audit_logs" ADD CONSTRAINT "editorial_audit_logs_actor_id_admin_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_aliases" ADD CONSTRAINT "entity_aliases_entity_id_historical_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."historical_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_aliases" ADD CONSTRAINT "entity_aliases_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_evidence" ADD CONSTRAINT "entity_evidence_entity_id_historical_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."historical_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_evidence" ADD CONSTRAINT "entity_evidence_evidence_id_evidence_sources_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_sources" ADD CONSTRAINT "evidence_sources_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_runs" ADD CONSTRAINT "game_runs_operation_id_daily_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."daily_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_runs" ADD CONSTRAINT "game_runs_guest_session_id_guest_sessions_id_fk" FOREIGN KEY ("guest_session_id") REFERENCES "public"."guest_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licensed_assets" ADD CONSTRAINT "licensed_assets_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_questions" ADD CONSTRAINT "operation_questions_operation_id_daily_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."daily_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_questions" ADD CONSTRAINT "operation_questions_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operation_snapshots" ADD CONSTRAINT "operation_snapshots_operation_id_daily_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."daily_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_results" ADD CONSTRAINT "public_results_run_id_game_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."game_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_answer_aliases" ADD CONSTRAINT "question_answer_aliases_question_version_id_entity_id_question_eligible_entities_question_version_id_entity_id_fk" FOREIGN KEY ("question_version_id","entity_id") REFERENCES "public"."question_eligible_entities"("question_version_id","entity_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_eligible_entities" ADD CONSTRAINT "question_eligible_entities_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_eligible_entities" ADD CONSTRAINT "question_eligible_entities_entity_id_historical_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."historical_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_eligible_entities" ADD CONSTRAINT "question_eligible_entities_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_rounds" ADD CONSTRAINT "run_rounds_run_id_game_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."game_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_rounds" ADD CONSTRAINT "run_rounds_question_version_id_question_versions_id_fk" FOREIGN KEY ("question_version_id") REFERENCES "public"."question_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_rounds" ADD CONSTRAINT "run_rounds_chosen_entity_id_historical_entities_id_fk" FOREIGN KEY ("chosen_entity_id") REFERENCES "public"."historical_entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appeal_triage" ON "answer_appeals" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_daily" ON "daily_operations" USING btree ("date_key") WHERE "daily_operations"."status" = 'published';--> statement-breakpoint
CREATE INDEX "daily_lookup" ON "daily_operations" USING btree ("date_key","status");--> statement-breakpoint
CREATE INDEX "editorial_action_lookup" ON "editorial_audit_logs" USING btree ("subject_type","subject_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "entity_alias_lookup" ON "entity_aliases" USING btree ("normalized_alias") WHERE "entity_aliases"."alias_status" = 'approved';--> statement-breakpoint
CREATE INDEX "evidence_entity_status" ON "entity_evidence" USING btree ("entity_id","claim_status");--> statement-breakpoint
CREATE INDEX "open_round_lookup" ON "run_rounds" USING btree ("run_id","round_index");