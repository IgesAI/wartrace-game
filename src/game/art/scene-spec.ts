/**
 * WARTRACE "Dusk Archive" Western Front-inspired scene — ORIGINAL procedural art (asset register:
 * SCENE-WF-*). Pure data: both the Pixi renderer and the SVG fallback/share renderer draw from it.
 * Fictionalized landscape; not a reconstruction of any specific battlefield.
 */
import tokens from "../../../assets/style_tokens.json";

export const LOGICAL_W = tokens.scene.logicalWidth; // 960
export const LOGICAL_H = tokens.scene.logicalHeight; // 540
export const TILE_W = LOGICAL_W * 2;
export const PATH_Y = 452;
/** Logical pixels the camera moves per game-world metre (ground layer). */
export const PX_PER_METRE = 1;
export const TARGET_FPS = { mobile: tokens.scene.targetFPSMobile, desktop: tokens.scene.targetFPSDesktop };

export const C = {
  ink: tokens.colors.ink,
  raised: tokens.colors.raisedInk,
  canvas: tokens.colors.agedCanvas,
  paper: tokens.colors.paper,
  brass: tokens.colors.brass,
  olive: tokens.colors.fogOlive,
  rust: tokens.colors.signalRust,
  slate: tokens.colors.slate,
  cloud: tokens.colors.deepCloud,
  horizon: tokens.colors.paleHorizon,
} as const;

export type Prim =
  | { t: "rect"; x: number; y: number; w: number; h: number; c: string; a?: number }
  | { t: "poly"; p: number[]; c: string; a?: number }
  | { t: "line"; p: number[]; c: string; w: number; a?: number }
  | { t: "ellipse"; x: number; y: number; rx: number; ry: number; c: string; a?: number };

export type LayerId = "sky" | "horizon" | "fog" | "mid" | "ground" | "foreground";
export type Layer = { id: LayerId; speed: number; prims: Prim[]; drift?: number };

export const PARALLAX = tokens.scene.parallaxSpeeds as Record<LayerId, number>;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Emits a primitive and its wrapped copy so tiles are seamless. */
function wrap(out: Prim[], prim: Prim, minX: number, maxX: number) {
  out.push(prim);
  const shift = minX < 0 ? TILE_W : maxX > TILE_W ? -TILE_W : 0;
  if (!shift) return;
  if (prim.t === "rect" || prim.t === "ellipse") out.push({ ...prim, x: prim.x + shift });
  else out.push({ ...prim, p: prim.p.map((v, i) => (i % 2 === 0 ? v + shift : v)) });
}

function ridge(r: () => number, baseY: number, amp: number, step: number, bottom: number): number[] {
  const pts: number[] = [];
  const n = Math.ceil(TILE_W / step);
  const phase = r() * Math.PI * 2;
  for (let i = 0; i <= n; i++) {
    const x = i * step;
    const k = (x / TILE_W) * Math.PI * 2;
    const y = baseY + Math.sin(k * 2 + phase) * amp * 0.6 + Math.sin(k * 5 + phase * 2) * amp * 0.3 + Math.sin(k * 11) * amp * 0.1;
    pts.push(x, Math.round(y));
  }
  return [...pts, TILE_W, bottom, 0, bottom];
}

function sky(): Layer {
  const prims: Prim[] = [];
  const bands = [C.raised, "#202b27", C.cloud, "#33403d", "#3d4b47", C.slate, "#56655f", "#64716a", C.olive, "#8c9789", "#9ca693", C.horizon];
  const bandH = 30;
  bands.forEach((c, i) => prims.push({ t: "rect", x: 0, y: i * bandH, w: TILE_W, h: bandH + 1, c }));
  prims.push({ t: "rect", x: 0, y: bands.length * bandH, w: TILE_W, h: LOGICAL_H, c: C.horizon });
  prims.push({ t: "rect", x: 0, y: 318, w: TILE_W, h: 14, c: C.brass, a: 0.18 });
  prims.push({ t: "rect", x: 0, y: 300, w: TILE_W, h: 18, c: C.brass, a: 0.09 });
  for (let i = 0; i < 4; i++) prims.push({ t: "ellipse", x: 1320, y: 318, rx: 40 + i * 34, ry: 22 + i * 14, c: C.paper, a: 0.06 });
  prims.push({ t: "ellipse", x: 1320, y: 318, rx: 18, ry: 18, c: C.paper, a: 0.5 });
  const r = rng(11);
  for (let i = 0; i < 22; i++) {
    const x = r() * TILE_W;
    const y = 40 + r() * 230;
    const w = 120 + r() * 360;
    const h = 4 + Math.round(r() * 3) * 2;
    const light = y > 160;
    wrap(prims, { t: "rect", x, y, w, h, c: light ? C.horizon : C.slate, a: light ? 0.22 : 0.35 }, x, x + w);
    wrap(prims, { t: "rect", x: x + w * 0.2, y: y + h, w: w * 0.6, h: 2, c: C.paper, a: 0.08 }, x, x + w);
  }
  return { id: "sky", speed: PARALLAX.sky, prims, drift: 4 };
}

function brokenTree(out: Prim[], x: number, baseY: number, h: number, c: string, r: () => number) {
  out.push({ t: "rect", x: x - 2, y: baseY - h, w: 4, h, c });
  const branches = 2 + Math.floor(r() * 3);
  for (let i = 0; i < branches; i++) {
    const by = baseY - h * (0.45 + r() * 0.45);
    const dir = r() > 0.5 ? 1 : -1;
    const len = 8 + r() * 14;
    out.push({ t: "line", p: [x, by, x + dir * len, by - len * 0.6], c, w: 2 });
  }
}

function horizon(): Layer {
  const prims: Prim[] = [];
  const r = rng(23);
  const far = "#56655f";
  const near = "#46544f";
  prims.push({ t: "poly", p: ridge(r, 338, 10, 24, LOGICAL_H), c: far });
  const items: [number, (x: number) => void][] = [];
  const village = (cx: number) => {
    for (let i = 0; i < 6; i++) {
      const x = cx + i * 22 + r() * 6;
      const w = 16 + r() * 10;
      const h = 10 + r() * 10;
      const y = 340 - h;
      prims.push({ t: "rect", x, y, w, h: h + 8, c: near });
      if (r() > 0.25) prims.push({ t: "poly", p: [x - 2, y, x + w / 2, y - 8 - r() * 4, x + w + 2, y], c: near });
      else prims.push({ t: "poly", p: [x, y, x + w * 0.4, y - 5, x + w * 0.55, y + 2, x + w, y - 3, x + w, y], c: near });
    }
    const sx = cx + 70;
    prims.push({ t: "rect", x: sx, y: 300, w: 10, h: 42, c: near });
    prims.push({ t: "poly", p: [sx - 2, 300, sx + 5, 270, sx + 12, 300], c: near });
  };
  const mill = (cx: number) => {
    prims.push({ t: "poly", p: [cx - 8, 342, cx - 4, 306, cx + 4, 306, cx + 8, 342], c: near });
    prims.push({ t: "line", p: [cx - 18, 296, cx + 18, 318], c: near, w: 2 });
    prims.push({ t: "line", p: [cx - 18, 318, cx + 18, 296], c: near, w: 2 });
  };
  items.push([120, village], [760, mill], [1180, village], [1640, mill]);
  for (const [x, fn] of items) fn(x);
  for (let i = 0; i < 26; i++) brokenTree(prims, r() * TILE_W, 344, 14 + r() * 26, near, r);
  prims.push({ t: "poly", p: ridge(r, 352, 6, 16, LOGICAL_H), c: "#4a5853" });
  return { id: "horizon", speed: PARALLAX.horizon, prims };
}

function fog(): Layer {
  const prims: Prim[] = [];
  const r = rng(37);
  for (let i = 0; i < 16; i++) {
    const x = r() * TILE_W;
    const rx = 140 + r() * 260;
    wrap(prims, { t: "ellipse", x, y: 352 + r() * 46, rx, ry: 8 + r() * 12, c: C.horizon, a: 0.12 + r() * 0.12 }, x - rx, x + rx);
  }
  for (let i = 0; i < 6; i++) {
    const y = 344 + i * 12;
    prims.push({ t: "rect", x: 0, y, w: TILE_W, h: 4, c: C.paper, a: 0.035 });
  }
  return { id: "fog", speed: PARALLAX.fog, prims, drift: 9 };
}

function mid(): Layer {
  const prims: Prim[] = [];
  const r = rng(41);
  const earth = C.cloud;
  prims.push({ t: "poly", p: ridge(r, 404, 12, 32, LOGICAL_H), c: earth });
  // Parapet line of sandbags along the earthwork crest, set well back from the path.
  for (let x = 0; x < TILE_W; x += 32) {
    if (r() < 0.22) continue;
    const y = 396 + Math.round(Math.sin((x / TILE_W) * Math.PI * 4) * 6);
    for (let k = 0; k < 3; k++) prims.push({ t: "rect", x: x + k * 10, y: y - (k === 1 ? 4 : 0), w: 9, h: 5, c: "#3a4744" });
  }
  // Timber posts with sagging wire, at respectful distance.
  let x = 40;
  while (x < TILE_W - 40) {
    const h = 18 + r() * 14;
    const y = 400;
    prims.push({ t: "rect", x, y: y - h, w: 3, h, c: C.raised });
    const nx = x + 48 + r() * 30;
    if (nx < TILE_W - 40 && r() > 0.3) {
      prims.push({ t: "line", p: [x + 2, y - h + 4, (x + nx) / 2, y - h + 9, nx + 2, y - h + 5], c: C.slate, w: 1, a: 0.8 });
      prims.push({ t: "line", p: [x + 2, y - h + 11, (x + nx) / 2, y - h + 15, nx + 2, y - h + 12], c: C.slate, w: 1, a: 0.6 });
    }
    x = nx;
  }
  // Two timber observation frames and a collapsed fence.
  for (const ox of [520, 1460]) {
    prims.push({ t: "line", p: [ox, 400, ox + 14, 330, ox + 28, 400], c: C.raised, w: 3 });
    prims.push({ t: "rect", x: ox + 2, y: 326, w: 26, h: 8, c: C.raised });
    prims.push({ t: "line", p: [ox + 6, 370, ox + 22, 370], c: C.raised, w: 2 });
  }
  for (let i = 0; i < 6; i++) prims.push({ t: "line", p: [980 + i * 14, 404, 990 + i * 14, 386 + (i % 2) * 6], c: C.raised, w: 2 });
  prims.push({ t: "line", p: [976, 394, 1066, 398], c: C.raised, w: 2 });
  // Subtle rim light along the crest.
  const crest = ridge(r, 404, 12, 32, LOGICAL_H).slice(0, -4);
  prims.push({ t: "line", p: crest, c: C.olive, w: 1, a: 0.45 });
  return { id: "mid", speed: PARALLAX.mid, prims };
}

function ground(): Layer {
  const prims: Prim[] = [];
  const r = rng(53);
  prims.push({ t: "rect", x: 0, y: PATH_Y - 22, w: TILE_W, h: LOGICAL_H, c: "#232d29" });
  prims.push({ t: "poly", p: ridge(r, PATH_Y - 14, 5, 32, LOGICAL_H), c: C.raised });
  // Worn earth path with duckboards (32px tile grammar).
  prims.push({ t: "rect", x: 0, y: PATH_Y, w: TILE_W, h: 26, c: "#2b3531" });
  for (let x = 0; x < TILE_W; x += 32) {
    if (r() < 0.12) continue;
    const tilt = Math.round((r() - 0.5) * 2);
    prims.push({ t: "rect", x: x + 2, y: PATH_Y + 4 + tilt, w: 26, h: 8, c: "#5a5544" });
    prims.push({ t: "rect", x: x + 2, y: PATH_Y + 4 + tilt, w: 26, h: 2, c: C.brass, a: 0.35 });
    prims.push({ t: "rect", x: x + 4, y: PATH_Y + 12 + tilt, w: 2, h: 6, c: C.raised });
    prims.push({ t: "rect", x: x + 24, y: PATH_Y + 12 + tilt, w: 2, h: 6, c: C.raised });
  }
  prims.push({ t: "rect", x: 0, y: PATH_Y + 24, w: TILE_W, h: 3, c: C.ink, a: 0.6 });
  for (let i = 0; i < 140; i++) {
    const x = r() * TILE_W;
    const y = PATH_Y + 30 + r() * 70;
    prims.push({ t: "rect", x, y, w: 2 + r() * 6, h: 2, c: r() > 0.5 ? "#33403d" : "#1d2622" });
  }
  for (let i = 0; i < 60; i++) {
    const x = r() * TILE_W;
    const h = 4 + r() * 10;
    prims.push({ t: "line", p: [x, PATH_Y - 2, x + (r() - 0.5) * 4, PATH_Y - 2 - h], c: C.olive, w: 1, a: 0.7 });
  }
  return { id: "ground", speed: PARALLAX.ground, prims };
}

function foreground(): Layer {
  const prims: Prim[] = [];
  const r = rng(67);
  for (let i = 0; i < 46; i++) {
    const x = r() * TILE_W;
    const h = 20 + r() * 50;
    const lean = (r() - 0.5) * 14;
    wrap(prims, { t: "poly", p: [x - 2, LOGICAL_H, x + lean, LOGICAL_H - h, x + 2, LOGICAL_H], c: C.ink }, x - 10, x + 10);
  }
  for (const bx of [300, 1100, 1700]) {
    prims.push({ t: "poly", p: [bx, 540, bx + 60, 506, bx + 66, 510, bx + 10, 540], c: C.ink });
    prims.push({ t: "line", p: [bx + 34, 522, bx + 44, 500], c: C.ink, w: 3 });
  }
  return { id: "foreground", speed: PARALLAX.foreground, prims };
}

let cached: Layer[] | null = null;
export function sceneLayers(): Layer[] {
  return (cached ??= [sky(), horizon(), fog(), mid(), ground(), foreground()]);
}

/** Scenic landmarks along the 5.6 km route (world metres). Nonliteral journey markers. */
export const LANDMARKS: { m: number; name: string }[] = [
  { m: 0, name: "The Waystone" },
  { m: 1100, name: "Chapel Arch" },
  { m: 2300, name: "Lone Poplar" },
  { m: 3500, name: "Mill Bridge" },
  { m: 4700, name: "Signal Hill" },
  { m: 5600, name: "The Far Archive" },
];

export function landmarkPrims(index: number, x: number): Prim[] {
  const y = PATH_Y - 2;
  const post: Prim[] = [
    { t: "rect", x: x - 2, y: y - 46, w: 4, h: 46, c: C.raised },
    { t: "rect", x: x - 14, y: y - 44, w: 28, h: 12, c: C.brass, a: 0.9 },
    { t: "rect", x: x - 12, y: y - 42, w: 24, h: 2, c: C.paper, a: 0.6 },
  ];
  const k = index % 6;
  const ink = C.raised;
  const extra: Prim[][] = [
    [{ t: "poly", p: [x + 20, y, x + 26, y - 26, x + 40, y - 30, x + 46, y], c: ink }],
    [
      { t: "rect", x: x + 24, y: y - 64, w: 8, h: 64, c: ink },
      { t: "rect", x: x + 64, y: y - 64, w: 8, h: 64, c: ink },
      { t: "poly", p: [x + 22, y - 64, x + 48, y - 92, x + 74, y - 64, x + 64, y - 64, x + 48, y - 80, x + 32, y - 64], c: ink },
    ],
    [
      { t: "rect", x: x + 36, y: y - 96, w: 5, h: 96, c: ink },
      { t: "ellipse", x: x + 38, y: y - 92, rx: 10, ry: 26, c: ink },
      { t: "ellipse", x: x + 46, y: y - 50, rx: 4, ry: 4, c: C.rust, a: 0.9 },
    ],
    [
      { t: "poly", p: [x + 10, y, x + 40, y - 18, x + 90, y - 18, x + 120, y], c: ink },
      { t: "rect", x: x + 40, y: y - 22, w: 50, h: 4, c: C.brass, a: 0.5 },
    ],
    [
      { t: "line", p: [x + 40, y, x + 40, y - 84], c: ink, w: 3 },
      { t: "rect", x: x + 40, y: y - 84, w: 24, h: 14, c: C.canvas, a: 0.8 },
    ],
    [
      { t: "poly", p: [x + 16, y, x + 56, y - 58, x + 96, y], c: C.canvas, a: 0.85 },
      { t: "poly", p: [x + 48, y, x + 56, y - 30, x + 64, y], c: C.ink },
      { t: "ellipse", x: x + 56, y: y - 10, rx: 30, ry: 10, c: C.brass, a: 0.25 },
    ],
  ];
  return [...post, ...extra[k]!];
}

/** Courier silhouette (AVATAR-COURIER): wide-brim hat, coat, satchel, lantern. Non-combat. */
export function courierParts() {
  return {
    body: [
      { t: "poly", p: [-7, -30, 7, -30, 9, -8, -9, -8], c: C.ink },
      { t: "rect", x: -5, y: -38, w: 10, h: 9, c: C.ink },
      { t: "rect", x: -10, y: -40, w: 20, h: 3, c: C.ink },
      { t: "rect", x: -5, y: -44, w: 10, h: 5, c: C.ink },
      { t: "rect", x: -12, y: -26, w: 6, h: 10, c: "#2b2a22" },
      { t: "rect", x: -12, y: -26, w: 6, h: 1, c: C.brass, a: 0.8 },
      { t: "line", p: [7, -26, 13, -16], c: C.ink, w: 3 },
    ] as Prim[],
    lantern: [
      { t: "rect", x: 11, y: -16, w: 5, h: 6, c: C.rust },
      { t: "ellipse", x: 13.5, y: -13, rx: 12, ry: 12, c: C.rust, a: 0.18 },
    ] as Prim[],
    leg: [{ t: "rect", x: -2, y: 0, w: 4, h: 10, c: C.ink }] as Prim[],
  };
}
