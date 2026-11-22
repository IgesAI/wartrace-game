import { LANDMARKS, LOGICAL_H, LOGICAL_W, PX_PER_METRE, TILE_W, courierParts, landmarkPrims, sceneLayers, type Layer, type Prim } from "./scene-spec";

const n = (v: number) => Math.round(v * 10) / 10;

export function primToSvg(p: Prim): string {
  const op = p.a !== undefined && p.a < 1 ? ` fill-opacity="${p.a}"` : "";
  switch (p.t) {
    case "rect":
      return `<rect x="${n(p.x)}" y="${n(p.y)}" width="${n(p.w)}" height="${n(p.h)}" fill="${p.c}"${op}/>`;
    case "ellipse":
      return `<ellipse cx="${n(p.x)}" cy="${n(p.y)}" rx="${n(p.rx)}" ry="${n(p.ry)}" fill="${p.c}"${op}/>`;
    case "poly":
      return `<polygon points="${p.p.map(n).join(" ")}" fill="${p.c}"${op}/>`;
    case "line":
      return `<polyline points="${p.p.map(n).join(" ")}" fill="none" stroke="${p.c}" stroke-width="${p.w}"${p.a !== undefined ? ` stroke-opacity="${p.a}"` : ""}/>`;
  }
}

export function layerInnerSvg(layer: Layer): string {
  return layer.prims.map(primToSvg).join("");
}

/**
 * Static composition at a camera position, for the GPU-free fallback, share cards and replay frames.
 * `cropX` lets portrait/square outputs choose the visible slice of the 960-wide logical scene.
 */
export function sceneSvg(opts: { offsetM?: number; width?: number; courier?: boolean; cropW?: number; cropX?: number } = {}): string {
  const offset = (opts.offsetM ?? 0) * PX_PER_METRE;
  const cropW = opts.cropW ?? LOGICAL_W;
  const cropX = opts.cropX ?? 0;
  const parts: string[] = [];
  for (const layer of sceneLayers()) {
    const shift = -((offset * layer.speed) % TILE_W);
    const inner = layerInnerSvg(layer);
    parts.push(`<g transform="translate(${n(shift)} 0)">${inner}</g><g transform="translate(${n(shift + TILE_W)} 0)">${inner}</g>`);
    if (layer.id === "mid") {
      const lm = LANDMARKS.map((l, i) => ({ x: l.m * PX_PER_METRE - offset + cropX + cropW * 0.34, i })).filter((l) => l.x > -200 && l.x < cropX + cropW + 200);
      parts.push(lm.map((l) => landmarkPrims(l.i, l.x).map(primToSvg).join("")).join(""));
    }
  }
  if (opts.courier !== false) {
    const cx = cropX + cropW * 0.34;
    const parts2 = courierParts();
    const g = [...parts2.body, ...parts2.lantern].map(primToSvg).join("");
    const leg = parts2.leg.map(primToSvg).join("");
    parts.push(
      `<g transform="translate(${n(cx)} ${452 - 10}) scale(1.4)">${g}<g transform="translate(-3 -8) rotate(12)">${leg}</g><g transform="translate(3 -8) rotate(-10)">${leg}</g></g>`,
    );
  }
  const w = opts.width ?? cropW;
  const h = Math.round((w / cropW) * LOGICAL_H);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${cropX} 0 ${cropW} ${LOGICAL_H}" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">${parts.join("")}</svg>`;
}

export function svgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${typeof Buffer !== "undefined" ? Buffer.from(svg).toString("base64") : btoa(svg)}`;
}
