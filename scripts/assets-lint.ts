/**
 * npm run assets:lint            -> non-production rules (demo placeholders allowed, warned)
 * npm run assets:lint -- --production -> release rules (every runtime asset must be rights-approved)
 * npm run assets:hash            -> re-record sha256; any changed asset loses approval and returns to review
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { RUNTIME_ASSET_IDS } from "../src/game/art/asset-ids";
import { MEDIA_EXTENSIONS, lintAssets, type AssetRegister } from "../src/modules/assets/register";

const ROOT = process.cwd();
const REGISTER = path.join(ROOT, "assets/asset-register.json");

export function hashOf(paths: string[]): string | null {
  const h = createHash("sha256");
  for (const p of paths) {
    const abs = path.join(ROOT, p);
    if (!fs.existsSync(abs)) return null;
    h.update(fs.readFileSync(abs));
  }
  return h.digest("hex");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [path.relative(ROOT, p).split(path.sep).join("/")];
  });
}

const args = process.argv.slice(2);
const register = JSON.parse(fs.readFileSync(REGISTER, "utf8")) as AssetRegister;

if (args.includes("--write-hashes")) {
  let changed = 0;
  for (const a of register.assets) {
    const h = hashOf(a.hashed_paths);
    if (h && h !== a.sha256) {
      if (a.approved_for_release) {
        a.approved_for_release = false;
        a.rights_status = "candidate";
        a.reviewed_by = null;
        a.reviewed_at = null;
      }
      a.sha256 = h;
      changed++;
    }
  }
  fs.writeFileSync(REGISTER, JSON.stringify(register, null, 2) + "\n");
  console.log(`Updated ${changed} hash(es).`);
  process.exit(0);
}

const production = args.includes("--production");
const { issues } = lintAssets({
  register,
  hashOf,
  publicMediaFiles: walk(path.join(ROOT, "public")).filter((f) => MEDIA_EXTENSIONS.test(f)),
  referencedIds: [...RUNTIME_ASSET_IDS],
  production,
});
const errors = issues.filter((i) => i.severity === "error");
for (const i of issues) console.log(`${i.severity.toUpperCase().padEnd(7)} ${i.code.padEnd(24)} ${i.assetId ?? "-"}  ${i.message}`);
console.log(`\nassets:lint (${production ? "production" : "non-production"}): ${errors.length} error(s), ${issues.length - errors.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
