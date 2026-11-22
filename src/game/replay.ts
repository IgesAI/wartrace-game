"use client";

import { C, LOGICAL_H, PATH_Y, TILE_W, courierParts, sceneLayers } from "./art/scene-spec";
import { layerInnerSvg, primToSvg } from "./art/scene-svg";

/** SHARE-9x16: spoiler-safe vertical recap (tiers + distance only), recorded client-side. */
export type ReplayInput = {
  title: string;
  dateKey: string;
  demo: boolean;
  rounds: { outcome: string; tier: string | null; distanceM: number }[];
};

const W = 1080;
const H = 1920;
const FPS = 30;
const SCENE_H = Math.round(H * 0.6);
const SCALE = SCENE_H / LOGICAL_H;
const TIER_COLOR: Record<string, string> = { Common: C.olive, Curious: C.canvas, Uncommon: C.brass, Obscure: C.rust };

export function replaySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    pickMime() !== null
  );
}

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("layer raster failed"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Records the recap; resolves to a video Blob, or null when the browser cannot record. */
export async function recordReplay(input: ReplayInput, onProgress?: (p: number) => void): Promise<Blob | null> {
  const mime = pickMime();
  if (!replaySupported() || !mime) return null;

  const layers = await Promise.all(
    sceneLayers().map(async (l) => ({
      speed: l.speed,
      img: await loadSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_W}" height="${LOGICAL_H}" viewBox="0 0 ${TILE_W} ${LOGICAL_H}" shape-rendering="crispEdges">${layerInnerSvg(l)}</svg>`),
    })),
  );
  const cp = courierParts();
  const courier = await loadSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60" viewBox="-20 -50 40 60" shape-rendering="crispEdges">${[...cp.body, ...cp.lantern, ...cp.leg].map(primToSvg).join("")}</svg>`,
  );

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = false;
  const css = getComputedStyle(document.body);
  const display = css.getPropertyValue("--font-display").trim() || "sans-serif";
  const ui = css.getPropertyValue("--font-ui").trim() || "sans-serif";

  // Timeline: 1.2s intro, 1.35s per round, 2.4s finale.
  const intro = 1.2;
  const per = 1.35;
  const finale = 2.4;
  const total = intro + per * input.rounds.length + finale;
  const cumulative = input.rounds.reduce<number[]>((acc, r) => [...acc, (acc.at(-1) ?? 0) + r.distanceM], []);
  const finalM = cumulative.at(-1) ?? 0;

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (recorder.onstop = () => r()));

  const draw = (t: number) => {
    let distance = 0;
    let roundIdx = -1;
    let flash = 0;
    if (t >= intro) {
      const k = Math.min(input.rounds.length - 1, Math.floor((t - intro) / per));
      const local = Math.min(1, (t - intro - k * per) / per);
      roundIdx = t >= intro + per * input.rounds.length ? input.rounds.length : k;
      const from = k === 0 ? 0 : cumulative[k - 1]!;
      const to = cumulative[k]!;
      distance = roundIdx >= input.rounds.length ? finalM : from + (to - from) * easeInOut(Math.min(1, local * 1.25));
      flash = roundIdx < input.rounds.length ? Math.max(0, 1 - local * 1.6) : 0;
    }

    ctx.fillStyle = C.ink;
    ctx.fillRect(0, 0, W, H);
    const visibleW = W / SCALE;
    ctx.save();
    ctx.scale(SCALE, SCALE);
    for (const l of layers) {
      const shift = -((distance * l.speed) % TILE_W);
      ctx.drawImage(l.img, shift, 0);
      if (shift + TILE_W < visibleW) ctx.drawImage(l.img, shift + TILE_W, 0);
    }
    const bob = Math.abs(Math.sin(t * 9)) * -1.5;
    ctx.drawImage(courier, visibleW * 0.38 - 20, PATH_Y - 50 + bob, 40, 60);
    ctx.restore();

    const grad = ctx.createLinearGradient(0, SCENE_H - 260, 0, SCENE_H + 40);
    grad.addColorStop(0, "rgba(17,23,21,0)");
    grad.addColorStop(1, "rgba(17,23,21,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, SCENE_H - 260, W, 300);

    ctx.fillStyle = C.brass;
    ctx.font = `600 44px ${ui}`;
    ctx.textAlign = "left";
    ctx.fillText("WARTRACE", 72, 120);
    ctx.textAlign = "right";
    ctx.fillText(input.dateKey, W - 72, 120);

    ctx.textAlign = "left";
    ctx.fillStyle = C.canvas;
    ctx.font = `600 52px ${display}`;
    ctx.fillText(input.title, 72, SCENE_H + 110);
    ctx.fillStyle = C.paper;
    ctx.font = `700 220px ${display}`;
    ctx.fillText(`${Math.round(distance).toLocaleString("en-US")} m`, 64, SCENE_H + 330);

    const tickW = (W - 144 - 6 * 14) / 7;
    input.rounds.forEach((r, i) => {
      const shown = i < roundIdx || (i === roundIdx && t >= intro);
      ctx.fillStyle = shown ? (r.outcome === "valid" && r.tier ? TIER_COLOR[r.tier] ?? C.olive : "rgba(239,233,218,0.2)") : "rgba(239,233,218,0.08)";
      ctx.fillRect(72 + i * (tickW + 14), SCENE_H + 380, tickW, 22);
    });

    if (roundIdx >= 0 && roundIdx < input.rounds.length && flash > 0) {
      const r = input.rounds[roundIdx]!;
      ctx.globalAlpha = Math.min(1, flash * 1.4);
      ctx.fillStyle = r.outcome === "valid" && r.tier ? TIER_COLOR[r.tier] ?? C.paper : C.olive;
      ctx.font = `700 76px ${display}`;
      ctx.textAlign = "center";
      ctx.fillText(r.outcome === "valid" ? `${(r.tier ?? "").toUpperCase()}  +${r.distanceM} m` : "NO DISTANCE", W / 2, SCENE_H - 120);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = "left";
    ctx.fillStyle = C.brass;
    ctx.font = `600 54px ${ui}`;
    if (roundIdx >= input.rounds.length) ctx.fillText("Beat my expedition.", 72, H - 260);
    ctx.fillStyle = C.canvas;
    ctx.font = `400 36px ${ui}`;
    ctx.fillText("Same seven questions. Today only.", 72, H - 200);
    ctx.font = `400 26px ${ui}`;
    ctx.fillStyle = input.demo ? C.rust : "rgba(239,233,218,0.6)";
    ctx.fillText(input.demo ? "DEMO CONTENT · WARTRACE gameplay, not historical footage" : "WARTRACE gameplay — original art, not historical footage", 72, H - 110);
  };

  recorder.start(250);
  const started = performance.now();
  await new Promise<void>((resolve) => {
    const step = () => {
      const t = (performance.now() - started) / 1000;
      draw(Math.min(t, total));
      onProgress?.(Math.min(1, t / total));
      if (t >= total) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  return new Blob(chunks, { type: mime.split(";")[0] });
}
