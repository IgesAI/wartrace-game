import { z } from "zod";

export const RIGHTS_STATUSES = ["not_acquired", "candidate", "hold", "demo_placeholder", "approved", "rejected"] as const;

/** Mandatory audit fields from docs/21_ASSET_RIGHTS_AND_PROVENANCE_SOP.md, plus runtime wiring fields. */
export const assetRecordSchema = z
  .object({
    asset_id: z.string().regex(/^[A-Z0-9][A-Za-z0-9-]+$/),
    title: z.string().min(1),
    asset_type: z.enum(["scene_layer", "sprite", "ui", "share_template", "font", "audio", "archival_media"]),
    creator: z.string().nullable(),
    source_url: z.string().nullable(),
    canonical_download_url: z.string().nullable(),
    source_collection: z.string(),
    license_id: z.string().nullable(),
    license_url: z.string().nullable(),
    license_text_snapshot_path: z.string().nullable(),
    rights_status: z.enum(RIGHTS_STATUSES),
    commercial_ok: z.boolean(),
    derivative_ok: z.boolean(),
    in_game_ok: z.boolean(),
    marketing_export_ok: z.boolean(),
    credit_required: z.boolean().nullable(),
    credit_text: z.string().nullable(),
    artist_contract_ref: z.string().nullable(),
    purchase_receipt_ref: z.string().nullable(),
    retrieved_at: z.string().nullable(),
    version: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    historical_source_ids: z.array(z.string()),
    era: z.string().nullable(),
    sensitivity: z.string().nullable(),
    technical_qa: z.string().nullable(),
    reviewed_by: z.string().nullable(),
    reviewed_at: z.string().nullable(),
    approved_for_release: z.boolean(),
    replaced_by: z.string().nullable(),
    /** Repo-relative file(s) whose bytes are hashed: a shipped media file, or the source of procedurally generated art. */
    hashed_paths: z.array(z.string()).min(1),
    /** Path under public/ when the asset is a shipped static file. */
    runtime_path: z.string().nullable(),
    scene_keys: z.array(z.string()),
    marketing_use: z.boolean(),
    notes: z.string(),
  })
  .strict();

export const assetRegisterSchema = z.object({ version: z.string(), assets: z.array(assetRecordSchema) }).strict();

export type AssetRecord = z.infer<typeof assetRecordSchema>;
export type AssetRegister = z.infer<typeof assetRegisterSchema>;

export type AssetIssue = { severity: "error" | "warning"; assetId: string | null; code: string; message: string };

const BLOCKED_LICENSES = /^CC-BY(-SA)?-NC|^CC-BY-NC|^CC-BY-ND|NoDerivatives|NonCommercial/i;
const HOLD_LICENSES = /^CC-BY-SA|^GPL/i;
export const MEDIA_EXTENSIONS = /\.(png|jpe?g|webp|avif|gif|svg|mp3|ogg|wav|webm|mp4|woff2?|ttf|otf)$/i;

export type LintInput = {
  register: unknown;
  /** sha256 of concatenated bytes of each asset's hashed_paths, or null if a file is missing. */
  hashOf: (paths: string[]) => string | null;
  /** Media files present under public/ (repo-relative, e.g. "public/worlds/x.png"). */
  publicMediaFiles: string[];
  /** Asset IDs referenced by runtime code. */
  referencedIds: string[];
  production: boolean;
};

export function lintAssets(input: LintInput): { issues: AssetIssue[]; register: AssetRegister | null } {
  const issues: AssetIssue[] = [];
  const parsed = assetRegisterSchema.safeParse(input.register);
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      issues.push({ severity: "error", assetId: null, code: "REGISTER_SCHEMA", message: `${i.path.join(".")}: ${i.message}` });
    }
    return { issues, register: null };
  }
  const register = parsed.data;
  const ids = new Set<string>();
  const err = (assetId: string | null, code: string, message: string) => issues.push({ severity: "error", assetId, code, message });
  const warn = (assetId: string | null, code: string, message: string) => issues.push({ severity: "warning", assetId, code, message });

  for (const a of register.assets) {
    if (ids.has(a.asset_id)) err(a.asset_id, "DUPLICATE_ID", "Duplicate asset_id");
    ids.add(a.asset_id);

    const actual = input.hashOf(a.hashed_paths);
    if (!actual) err(a.asset_id, "FILE_MISSING", `Missing file(s): ${a.hashed_paths.join(", ")}`);
    else if (!a.sha256) err(a.asset_id, "HASH_MISSING", "sha256 not recorded");
    else if (a.sha256 !== actual) err(a.asset_id, "HASH_MISMATCH", "Bytes changed since registration; re-review and update sha256");

    if (a.license_id && BLOCKED_LICENSES.test(a.license_id)) err(a.asset_id, "LICENSE_BLOCKED", `License ${a.license_id} is RED for a commercial-capable product`);
    else if (a.license_id && HOLD_LICENSES.test(a.license_id)) err(a.asset_id, "LICENSE_HOLD", `License ${a.license_id} requires counsel review (AMBER)`);
    if (a.credit_required && !a.credit_text) err(a.asset_id, "CREDIT_MISSING", "Credit required but credit_text empty");
    if (a.rights_status === "rejected") err(a.asset_id, "REJECTED", "Asset was rejected and must not ship");
    if (a.approved_for_release && a.rights_status !== "approved") err(a.asset_id, "INCONSISTENT_APPROVAL", "approved_for_release requires rights_status=approved");
    if (a.approved_for_release && (!a.reviewed_by || !a.reviewed_at)) err(a.asset_id, "APPROVAL_UNSIGNED", "Approval needs reviewed_by and reviewed_at");
    if (a.marketing_use && !a.marketing_export_ok) {
      (input.production ? err : warn)(a.asset_id, "MARKETING_RIGHTS", "Used in share/marketing exports without marketing_export_ok");
    }

    const releasable = a.rights_status === "approved" && a.approved_for_release && a.in_game_ok && a.commercial_ok;
    if (!releasable) {
      if (input.production) err(a.asset_id, "NOT_APPROVED", `rights_status=${a.rights_status}; not approved for release`);
      else if (a.rights_status === "demo_placeholder") warn(a.asset_id, "DEMO_PLACEHOLDER", "Labelled demo placeholder (allowed outside production)");
      else warn(a.asset_id, "NOT_APPROVED", `rights_status=${a.rights_status}; blocked in production`);
    }
  }

  const registeredRuntime = new Set(register.assets.map((a) => a.runtime_path).filter(Boolean));
  for (const f of input.publicMediaFiles) {
    if (!registeredRuntime.has(f)) err(null, "UNREGISTERED_FILE", `${f} is shipped but not in the asset register`);
  }
  for (const id of input.referencedIds) {
    if (!ids.has(id)) err(id, "UNREGISTERED_REFERENCE", `Runtime code references unregistered asset ${id}`);
  }
  return { issues, register };
}

/** Assets for a scene that would block publication of verified (non-demo) content. */
export function unapprovedSceneAssets(register: AssetRegister, sceneKey: string): AssetRecord[] {
  return register.assets.filter(
    (a) => a.scene_keys.includes(sceneKey) && !(a.rights_status === "approved" && a.approved_for_release && a.in_game_ok),
  );
}
