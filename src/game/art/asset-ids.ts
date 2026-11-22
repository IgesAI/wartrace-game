/** Every asset ID the runtime ships. `npm run assets:lint` fails if any is missing from assets/asset-register.json. */
export const RUNTIME_ASSET_IDS = [
  "SCENE-WF-SKY",
  "SCENE-WF-HORIZON",
  "SCENE-WF-FOG",
  "SCENE-WF-MID",
  "SCENE-WF-GROUND",
  "SCENE-WF-FORE",
  "SCENE-WF-LANDMARKS",
  "AVATAR-COURIER",
  "UI-HUD",
  "SHARE-1x1",
  "SHARE-OG",
  "SHARE-9x16",
  "FONT-BARLOW-CONDENSED",
  "FONT-IBM-PLEX-SANS",
] as const;
