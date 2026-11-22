import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const guestSessions = pgTable("guest_sessions", {
  id: id(),
  secretHash: text("secret_hash").notNull().unique(),
  createdAt: ts("created_at").notNull().defaultNow(),
  expiresAt: ts("expires_at").notNull(),
  revokedAt: ts("revoked_at"),
  privacyOptOut: boolean("privacy_opt_out").notNull().default(false),
});

export const ADMIN_ROLES = ["reader", "editor", "reviewer", "publisher", "owner"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const adminUsers = pgTable(
  "admin_users",
  {
    id: id(),
    authSubject: text("auth_subject").notNull().unique(),
    email: text("email").unique(),
    displayName: text("display_name").notNull(),
    role: text("role").$type<AdminRole>().notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [check("admin_role_check", sql`${t.role} IN ('reader','editor','reviewer','publisher','owner')`)],
);

export const historicalEntities = pgTable(
  "historical_entities",
  {
    id: id(),
    canonicalName: text("canonical_name").notNull(),
    entityType: text("entity_type").notNull(),
    wikidataQid: text("wikidata_qid").unique(),
    startDate: text("start_date"),
    endDate: text("end_date"),
    disambiguation: text("disambiguation"),
    summary: text("summary"),
    isDemo: boolean("is_demo").notNull().default(false),
    editorialStatus: text("editorial_status").notNull().default("candidate"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    check(
      "entity_status_check",
      sql`${t.editorialStatus} IN ('candidate','corroborated','reviewed','disputed','retracted')`,
    ),
  ],
);

export const entityAliases = pgTable(
  "entity_aliases",
  {
    id: id(),
    entityId: uuid("entity_id").notNull().references(() => historicalEntities.id),
    alias: text("alias").notNull(),
    normalizedAlias: text("normalized_alias").notNull(),
    languageCode: text("language_code").notNull().default("en"),
    aliasStatus: text("alias_status").notNull().default("candidate"),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
  },
  (t) => [
    unique("entity_alias_unique").on(t.entityId, t.normalizedAlias, t.languageCode),
    index("entity_alias_lookup").on(t.normalizedAlias).where(sql`${t.aliasStatus} = 'approved'`),
    check("alias_status_check", sql`${t.aliasStatus} IN ('candidate','approved','rejected')`),
  ],
);

export const evidenceSources = pgTable(
  "evidence_sources",
  {
    id: id(),
    provider: text("provider").notNull(),
    sourceRecordId: text("source_record_id"),
    sourceUrl: text("source_url").notNull(),
    title: text("title").notNull(),
    publisher: text("publisher"),
    retrievedAt: ts("retrieved_at").notNull(),
    publicationDate: text("publication_date"),
    queryHash: text("query_hash"),
    sourceTier: text("source_tier").$type<"A" | "B" | "C" | "D">().notNull(),
    rightsStatement: text("rights_statement"),
    licenseCode: text("license_code"),
    reviewStatus: text("review_status").notNull().default("candidate"),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
  },
  (t) => [
    unique("evidence_provider_url").on(t.provider, t.sourceUrl),
    check("evidence_tier_check", sql`${t.sourceTier} IN ('A','B','C','D')`),
    check("evidence_review_check", sql`${t.reviewStatus} IN ('candidate','corroborated','reviewed','rejected')`),
  ],
);

export const entityEvidence = pgTable(
  "entity_evidence",
  {
    entityId: uuid("entity_id").notNull().references(() => historicalEntities.id),
    evidenceId: uuid("evidence_id").notNull().references(() => evidenceSources.id),
    claimSummary: text("claim_summary").notNull(),
    claimStatus: text("claim_status").notNull().default("candidate"),
  },
  (t) => [
    primaryKey({ columns: [t.entityId, t.evidenceId] }),
    index("evidence_entity_status").on(t.entityId, t.claimStatus),
    check("claim_status_check", sql`${t.claimStatus} IN ('candidate','reviewed','disputed','retracted')`),
  ],
);

export const questionVersions = pgTable(
  "question_versions",
  {
    id: id(),
    questionFamilyKey: text("question_family_key").notNull(),
    version: integer("version").notNull(),
    prompt: text("prompt").notNull(),
    internalEligibilityRules: text("internal_eligibility_rules").notNull(),
    internalExclusionRules: text("internal_exclusion_rules").notNull().default(""),
    topic: text("topic").notNull(),
    coverageClass: text("coverage_class").notNull().default("experimental_not_publishable"),
    coverageNote: text("coverage_note"),
    isDemo: boolean("is_demo").notNull().default(false),
    editorialStatus: text("editorial_status").notNull().default("draft"),
    createdBy: uuid("created_by").references(() => adminUsers.id),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
    approvedAt: ts("approved_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    unique("question_family_version").on(t.questionFamilyKey, t.version),
    check("question_version_check", sql`${t.version} >= 1`),
    check(
      "coverage_class_check",
      sql`${t.coverageClass} IN ('finite_certified','broad_reviewed','experimental_not_publishable')`,
    ),
    check(
      "question_status_check",
      sql`${t.editorialStatus} IN ('draft','review','approved','published','disputed','retired')`,
    ),
  ],
);

export const questionEligibleEntities = pgTable(
  "question_eligible_entities",
  {
    questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id),
    entityId: uuid("entity_id").notNull().references(() => historicalEntities.id),
    rarityScore: numeric("rarity_score", { precision: 7, scale: 6, mode: "number" }).notNull(),
    inclusionRationale: text("inclusion_rationale").notNull(),
    evidenceStatus: text("evidence_status").notNull().default("candidate"),
    approvedBy: uuid("approved_by").references(() => adminUsers.id),
  },
  (t) => [
    primaryKey({ columns: [t.questionVersionId, t.entityId] }),
    check("rarity_range_check", sql`${t.rarityScore} BETWEEN 0 AND 1`),
    check("eligible_evidence_check", sql`${t.evidenceStatus} IN ('candidate','reviewed','disputed','retracted')`),
  ],
);

/** One normalized alias maps to one entity per question version; collisions must be resolved before insert. */
export const questionAnswerAliases = pgTable(
  "question_answer_aliases",
  {
    questionVersionId: uuid("question_version_id").notNull(),
    entityId: uuid("entity_id").notNull(),
    normalizedAlias: text("normalized_alias").notNull(),
    displayAlias: text("display_alias").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.questionVersionId, t.normalizedAlias] }),
    foreignKey({
      columns: [t.questionVersionId, t.entityId],
      foreignColumns: [questionEligibleEntities.questionVersionId, questionEligibleEntities.entityId],
    }),
  ],
);

export const scoringVersions = pgTable("scoring_versions", {
  id: id(),
  identifier: text("identifier").notNull().unique(),
  algorithm: text("algorithm").notNull(),
  parameters: jsonb("parameters").$type<Record<string, number>>().notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
  frozenAt: ts("frozen_at"),
});

export const dailyOperations = pgTable(
  "daily_operations",
  {
    id: id(),
    dateKey: date("date_key", { mode: "string" }).notNull(),
    version: integer("version").notNull().default(1),
    title: text("title").notNull(),
    blurb: text("blurb").notNull(),
    sceneKey: text("scene_key").notNull(),
    scoreVersionId: uuid("score_version_id").notNull().references(() => scoringVersions.id),
    status: text("status").notNull().default("draft"),
    contentClass: text("content_class").$type<"verified" | "demo">(),
    contentChecksum: text("content_checksum"),
    publicationTimestamp: ts("publication_timestamp"),
    createdBy: uuid("created_by").references(() => adminUsers.id),
    approvedBy: uuid("approved_by").references(() => adminUsers.id),
  },
  (t) => [
    unique("operation_date_version").on(t.dateKey, t.version),
    uniqueIndex("one_active_daily").on(t.dateKey).where(sql`${t.status} = 'published'`),
    index("daily_lookup").on(t.dateKey, t.status),
    check("operation_version_check", sql`${t.version} >= 1`),
    check(
      "operation_status_check",
      sql`${t.status} IN ('draft','review','approved','published','retired','disabled')`,
    ),
    check("operation_content_class_check", sql`${t.contentClass} IS NULL OR ${t.contentClass} IN ('verified','demo')`),
  ],
);

export const operationQuestions = pgTable(
  "operation_questions",
  {
    operationId: uuid("operation_id").notNull().references(() => dailyOperations.id),
    roundIndex: smallint("round_index").notNull(),
    questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id),
  },
  (t) => [
    primaryKey({ columns: [t.operationId, t.roundIndex] }),
    unique("operation_question_unique").on(t.operationId, t.questionVersionId),
    check("operation_round_check", sql`${t.roundIndex} BETWEEN 1 AND 7`),
  ],
);

/** Append-only frozen answer bundle; protected by DB trigger (see drizzle/0001_immutability.sql). */
export const operationSnapshots = pgTable("operation_snapshots", {
  operationId: uuid("operation_id")
    .primaryKey()
    .references(() => dailyOperations.id),
  snapshot: jsonb("snapshot").notNull(),
  checksum: text("checksum").notNull(),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const gameRuns = pgTable(
  "game_runs",
  {
    id: id(),
    operationId: uuid("operation_id").notNull().references(() => dailyOperations.id),
    guestSessionId: uuid("guest_session_id").notNull().references(() => guestSessions.id),
    operationVersion: integer("operation_version").notNull(),
    state: text("state").notNull().default("created"),
    currentRound: smallint("current_round").notNull().default(1),
    startedAt: ts("started_at").notNull().defaultNow(),
    completedAt: ts("completed_at"),
    totalScore: integer("total_score").notNull().default(0),
    totalDistanceM: integer("total_distance_m").notNull().default(0),
    referred: boolean("referred").notNull().default(false),
  },
  (t) => [
    unique("one_run_per_guest_operation").on(t.operationId, t.guestSessionId),
    check("run_state_check", sql`${t.state} IN ('created','active','completed','invalidated')`),
    check("run_round_range", sql`${t.currentRound} BETWEEN 1 AND 8`),
    check("run_score_range", sql`${t.totalScore} BETWEEN 0 AND 7000`),
    check("run_distance_range", sql`${t.totalDistanceM} BETWEEN 0 AND 5600`),
  ],
);

export const runRounds = pgTable(
  "run_rounds",
  {
    id: id(),
    runId: uuid("run_id").notNull().references(() => gameRuns.id),
    roundIndex: smallint("round_index").notNull(),
    questionVersionId: uuid("question_version_id").notNull().references(() => questionVersions.id),
    openedAt: ts("opened_at").notNull(),
    deadlineAt: ts("deadline_at").notNull(),
    lockedAt: ts("locked_at"),
    outcome: text("outcome").$type<"valid" | "invalid" | "timed_out">(),
    chosenEntityId: uuid("chosen_entity_id").references(() => historicalEntities.id),
    submittedText: text("submitted_text"),
    normalizedInputHash: text("normalized_input_hash"),
    points: integer("points"),
    distanceM: integer("distance_m"),
    rarityTier: text("rarity_tier"),
    idempotencyKey: uuid("idempotency_key"),
    clarifications: smallint("clarifications").notNull().default(0),
    clarificationKey: uuid("clarification_key"),
  },
  (t) => [
    unique("run_round_unique").on(t.runId, t.roundIndex),
    unique("run_idempotency_unique").on(t.runId, t.idempotencyKey),
    index("open_round_lookup").on(t.runId, t.roundIndex),
    check("round_index_range", sql`${t.roundIndex} BETWEEN 1 AND 7`),
    check("round_outcome_check", sql`${t.outcome} IS NULL OR ${t.outcome} IN ('valid','invalid','timed_out')`),
    check("round_points_range", sql`${t.points} IS NULL OR ${t.points} BETWEEN 0 AND 1000`),
    check("round_distance_range", sql`${t.distanceM} IS NULL OR ${t.distanceM} BETWEEN 0 AND 800`),
    check("round_deadline_after_open", sql`${t.deadlineAt} > ${t.openedAt}`),
    check(
      "round_lock_consistency",
      sql`(${t.lockedAt} IS NULL AND ${t.outcome} IS NULL) OR (${t.lockedAt} IS NOT NULL AND ${t.outcome} IS NOT NULL)`,
    ),
  ],
);

export const publicResults = pgTable("public_results", {
  id: id(),
  runId: uuid("run_id")
    .notNull()
    .unique()
    .references(() => gameRuns.id),
  shareToken: text("share_token").notNull().unique(),
  displayName: text("display_name"),
  shareConsent: boolean("share_consent").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const APPEAL_STATUSES = ["new", "triage", "valid_missing", "invalid", "ambiguous", "needs_research", "closed"] as const;
export const APPEAL_CATEGORIES = ["missing_valid_answer", "ambiguous_alias", "incorrect_source", "other"] as const;

export const answerAppeals = pgTable(
  "answer_appeals",
  {
    id: id(),
    guestSessionId: uuid("guest_session_id").references(() => guestSessions.id),
    runRoundId: uuid("run_round_id").references(() => runRounds.id),
    submittedText: text("submitted_text").notNull(),
    explanation: text("explanation").notNull(),
    evidenceUrl: text("evidence_url"),
    category: text("category").notNull(),
    status: text("status").notNull().default("new"),
    reviewerId: uuid("reviewer_id").references(() => adminUsers.id),
    reviewerNote: text("reviewer_note"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("one_appeal_per_round").on(t.runRoundId),
    index("appeal_triage").on(t.status, t.createdAt),
    check(
      "appeal_status_check",
      sql`${t.status} IN ('new','triage','valid_missing','invalid','ambiguous','needs_research','closed')`,
    ),
  ],
);

export const licensedAssets = pgTable(
  "licensed_assets",
  {
    id: id(),
    objectKey: text("object_key").notNull().unique(),
    originalUrl: text("original_url"),
    creator: text("creator"),
    licenseCode: text("license_code").notNull(),
    rightsStatement: text("rights_statement").notNull(),
    attributionLine: text("attribution_line"),
    sha256: text("sha256").notNull(),
    status: text("status").notNull().default("candidate"),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id),
  },
  (t) => [check("asset_status_check", sql`${t.status} IN ('candidate','approved','rejected')`)],
);

/** Append-only; UPDATE/DELETE blocked by trigger. */
export const editorialAuditLogs = pgTable(
  "editorial_audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id").references(() => adminUsers.id),
    action: text("action").notNull(),
    subjectType: text("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    reason: text("reason"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("editorial_action_lookup").on(t.subjectType, t.subjectId, t.createdAt.desc())],
);

export const telemetryEvents = pgTable("telemetry_events", {
  id: id(),
  eventName: text("event_name").notNull(),
  dateKey: date("date_key", { mode: "string" }),
  anonymousSessionBucket: text("anonymous_session_bucket"),
  eventProperties: jsonb("event_properties").notNull().default(sql`'{}'::jsonb`),
  occurredAt: ts("occurred_at").notNull().defaultNow(),
});
