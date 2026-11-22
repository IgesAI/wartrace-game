/** One-off generator for the initial register; kept for reproducibility. Run: npx tsx scripts/gen-asset-register.ts */
import fs from "node:fs";

const procedural = (asset_id: string, title: string, asset_type: string, hashed_paths: string[], extra: Record<string, unknown> = {}) => ({
  asset_id,
  title,
  asset_type,
  creator: "WARTRACE build agent (procedural code, authored in this repository)",
  source_url: null,
  canonical_download_url: null,
  source_collection: "original-procedural",
  license_id: null,
  license_url: null,
  license_text_snapshot_path: null,
  rights_status: "demo_placeholder",
  commercial_ok: false,
  derivative_ok: true,
  in_game_ok: false,
  marketing_export_ok: false,
  credit_required: false,
  credit_text: null,
  artist_contract_ref: null,
  purchase_receipt_ref: null,
  retrieved_at: null,
  version: "0.1.0",
  sha256: null,
  historical_source_ids: [],
  era: "WWI-inspired, fictionalized",
  sensitivity: "Non-combat; no insignia, flags, weapons or casualties depicted.",
  technical_qa: null,
  reviewed_by: null,
  reviewed_at: null,
  approved_for_release: false,
  replaced_by: null,
  hashed_paths,
  runtime_path: null,
  scene_keys: ["western-front"],
  marketing_use: false,
  notes:
    "Visually coherent procedural demonstration art, NOT final commissioned artwork. Owner must confirm IP ownership of agent-authored code and a rights reviewer must approve before release.",
  ...extra,
});

const spec = ["src/game/art/scene-spec.ts"];
const font = (asset_id: string, title: string, url: string) => ({
  ...procedural(asset_id, title, "font", ["src/app/fonts.ts"]),
  creator: title.includes("Barlow") ? "Jeremy Tribby (Barlow)" : "IBM / Mike Abbink & Bold Monday (IBM Plex)",
  source_url: url,
  source_collection: "Google Fonts (self-hosted at build by next/font)",
  license_id: "OFL-1.1",
  license_url: "https://openfontlicense.org/",
  rights_status: "candidate",
  commercial_ok: true,
  in_game_ok: true,
  marketing_export_ok: true,
  credit_required: false,
  credit_text: `${title} — SIL Open Font License 1.1`,
  scene_keys: [],
  era: null,
  sensitivity: null,
  notes: "OFL permits embedding/commercial use. Reviewer must archive the license text snapshot and confirm the served version.",
});

const register = {
  version: "1.0",
  assets: [
    procedural("SCENE-WF-SKY", "Dusk sky bands and clouds (layer 00, 0.05x)", "scene_layer", spec, { marketing_use: true }),
    procedural("SCENE-WF-HORIZON", "Far village, mills and broken trees (layer 01, 0.12x)", "scene_layer", spec, { marketing_use: true }),
    procedural("SCENE-WF-FOG", "Fog wisps (layer 02, 0.2x + drift)", "scene_layer", spec, { marketing_use: true }),
    procedural("SCENE-WF-MID", "Earthworks, timber posts and wire at distance (layer 03, 0.45x)", "scene_layer", spec, { marketing_use: true }),
    procedural("SCENE-WF-GROUND", "Worn path and duckboards, 32px grammar (layer 04, 1.0x)", "scene_layer", spec, { marketing_use: true }),
    procedural("SCENE-WF-FORE", "Foreground grasses and branches (layer 05, 1.15x)", "scene_layer", spec, { marketing_use: true }),
    procedural("SCENE-WF-LANDMARKS", "Six route landmarks (Waystone to Far Archive)", "scene_layer", spec, { marketing_use: true }),
    procedural("AVATAR-COURIER", "Non-combat courier silhouette with lantern", "sprite", spec, { marketing_use: true }),
    procedural("UI-HUD", "HUD, timer ring, progress route (CSS)", "ui", ["src/app/globals.css"], { scene_keys: [] }),
    procedural("SHARE-1x1", "1200x1200 spoiler-safe result card", "share_template", ["src/modules/share/card.tsx"], { scene_keys: [], marketing_use: true }),
    procedural("SHARE-OG", "1200x630 Open Graph card", "share_template", ["src/modules/share/card.tsx"], { scene_keys: [], marketing_use: true }),
    procedural("SHARE-9x16", "1080x1920 client-recorded WebM recap", "share_template", ["src/game/replay.ts"], { scene_keys: [], marketing_use: true }),
    font("FONT-BARLOW-CONDENSED", "Barlow Condensed", "https://fonts.google.com/specimen/Barlow+Condensed"),
    font("FONT-IBM-PLEX-SANS", "IBM Plex Sans", "https://fonts.google.com/specimen/IBM+Plex+Sans"),
  ],
};

fs.writeFileSync("assets/asset-register.json", JSON.stringify(register, null, 2) + "\n");
console.log(`Wrote ${register.assets.length} assets`);
