import type { Application, Container, Graphics, TilingSprite } from "pixi.js";
import { LANDMARKS, LOGICAL_H, LOGICAL_W, PATH_Y, PX_PER_METRE, TILE_W, C, courierParts, landmarkPrims, sceneLayers, type Prim } from "./art/scene-spec";

export type SceneHandle = {
  travelTo: (distanceM: number, opts?: { rare?: boolean; instant?: boolean }) => Promise<void>;
  setReducedMotion: (v: boolean) => void;
  destroy: () => void;
  rendererType: string;
};

function draw(g: Graphics, prims: Prim[]) {
  for (const p of prims) {
    const alpha = p.a ?? 1;
    if (p.t === "rect") g.rect(p.x, p.y, p.w, p.h).fill({ color: p.c, alpha });
    else if (p.t === "ellipse") g.ellipse(p.x, p.y, p.rx, p.ry).fill({ color: p.c, alpha });
    else if (p.t === "poly") g.poly(p.p).fill({ color: p.c, alpha });
    else {
      g.moveTo(p.p[0]!, p.p[1]!);
      for (let i = 2; i < p.p.length; i += 2) g.lineTo(p.p[i]!, p.p[i + 1]!);
      g.stroke({ width: p.w, color: p.c, alpha });
    }
  }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function createPixiScene(host: HTMLElement, opts: { initialDistanceM: number; reducedMotion: boolean }): Promise<SceneHandle> {
  const PIXI = await import("pixi.js");
  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 600;
  const app: Application = new PIXI.Application();
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2),
    autoDensity: true,
    preference: "webgl",
    powerPreference: "low-power",
  });
  app.canvas.setAttribute("aria-hidden", "true");
  app.canvas.style.display = "block";
  host.appendChild(app.canvas);

  let reducedMotion = opts.reducedMotion;
  const root = new PIXI.Container();
  app.stage.addChild(root);

  const layers: { sprite: TilingSprite; speed: number; drift: number; id: string; driftX: number }[] = [];
  const world: Container = new PIXI.Container();
  for (const layer of sceneLayers()) {
    const g = new PIXI.Graphics();
    draw(g, layer.prims);
    const texture = app.renderer.generateTexture({ target: g, frame: new PIXI.Rectangle(0, 0, TILE_W, LOGICAL_H), resolution: 0.5 });
    texture.source.scaleMode = "nearest";
    g.destroy();
    const sprite = new PIXI.TilingSprite({ texture, width: LOGICAL_W, height: LOGICAL_H });
    root.addChild(sprite);
    layers.push({ sprite, speed: layer.speed, drift: layer.drift ?? 0, id: layer.id, driftX: 0 });
    if (layer.id === "mid") root.addChild(world);
  }

  LANDMARKS.forEach((l, i) => {
    const g = new PIXI.Graphics();
    draw(g, landmarkPrims(i, 0));
    g.x = l.m * PX_PER_METRE;
    world.addChild(g);
  });

  const parts = courierParts();
  const courier = new PIXI.Container();
  const body = new PIXI.Graphics();
  draw(body, parts.body);
  const lantern = new PIXI.Graphics();
  draw(lantern, parts.lantern);
  const legA = new PIXI.Graphics();
  const legB = new PIXI.Graphics();
  draw(legA, parts.leg);
  draw(legB, parts.leg);
  legA.position.set(-3, -8);
  legB.position.set(3, -8);
  courier.addChild(legB, body, legA, lantern);
  courier.scale.set(1.4);
  root.addChild(courier);

  const dustLayer = new PIXI.Container();
  root.addChild(dustLayer);
  const dust: { g: Graphics; vx: number; vy: number }[] = [];
  const dustCount = isSmall ? 28 : 64;
  for (let i = 0; i < dustCount; i++) {
    const g = new PIXI.Graphics().rect(0, 0, 2, 2).fill({ color: C.paper, alpha: 0.35 });
    g.position.set(Math.random() * LOGICAL_W, 200 + Math.random() * 320);
    dust.push({ g, vx: 4 + Math.random() * 8, vy: -2 - Math.random() * 3 });
    dustLayer.addChild(g);
  }

  let camera = opts.initialDistanceM * PX_PER_METRE;
  let visibleW = LOGICAL_W;
  let courierX = LOGICAL_W * 0.34;
  let walking = false;
  let walkPhase = 0;
  let fogAlpha = 1;
  let fogTarget = 1;
  let tween: { from: number; to: number; start: number; dur: number; resolve: () => void } | null = null;

  const layout = () => {
    const w = app.renderer.width / app.renderer.resolution;
    const h = app.renderer.height / app.renderer.resolution;
    const scale = Math.max(h / LOGICAL_H, w / (LOGICAL_W * 1.6));
    root.scale.set(scale);
    visibleW = w / scale;
    root.y = h - LOGICAL_H * scale;
    courierX = Math.min(visibleW * 0.34, 340);
    for (const l of layers) l.sprite.width = visibleW + 2;
    courier.position.set(courierX, PATH_Y - 10);
  };
  layout();
  app.renderer.on("resize", layout);

  const apply = () => {
    const cam = Math.round(camera);
    for (const l of layers) {
      l.sprite.tilePosition.x = -Math.round(cam * l.speed + l.driftX);
      if (l.id === "fog") l.sprite.alpha = fogAlpha;
    }
    world.x = Math.round(courierX - cam);
  };

  app.ticker.maxFPS = isSmall ? 30 : 60;
  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000;
    const now = performance.now();
    if (tween) {
      const t = Math.min(1, (now - tween.start) / tween.dur);
      camera = tween.from + (tween.to - tween.from) * ease(t);
      walking = t < 1;
      if (t >= 1) {
        const done = tween.resolve;
        tween = null;
        done();
      }
    }
    if (!reducedMotion) {
      for (const l of layers) l.driftX += l.drift * dt;
      for (const d of dust) {
        d.g.x += d.vx * dt;
        d.g.y += d.vy * dt;
        if (d.g.x > visibleW + 4) d.g.x = -4;
        if (d.g.y < 180) d.g.y = 520;
      }
      fogAlpha += (fogTarget - fogAlpha) * Math.min(1, dt * 2.5);
    }
    dustLayer.visible = !reducedMotion;
    walkPhase += dt * (walking ? 11 : 0);
    const swing = walking ? Math.sin(walkPhase) * 0.5 : 0;
    legA.rotation = swing;
    legB.rotation = -swing;
    body.y = walking ? Math.abs(Math.sin(walkPhase)) * -1.2 : reducedMotion ? 0 : Math.sin(now / 900) * 0.4;
    lantern.y = body.y;
    lantern.alpha = reducedMotion ? 1 : 0.85 + Math.sin(now / 420) * 0.15;
    apply();
  });

  const travelTo: SceneHandle["travelTo"] = (distanceM, o = {}) => {
    const target = distanceM * PX_PER_METRE;
    if (tween) {
      tween.resolve();
      tween = null;
    }
    if (o.instant || reducedMotion || Math.abs(target - camera) < 1) {
      camera = target;
      apply();
      return Promise.resolve();
    }
    if (o.rare) {
      fogTarget = 0.3;
      setTimeout(() => (fogTarget = 1), 2200);
    }
    const dur = Math.max(600, Math.min(1100, 600 + Math.abs(target - camera) * 0.6));
    return new Promise<void>((resolve) => {
      tween = { from: camera, to: target, start: performance.now(), dur, resolve };
    });
  };

  return {
    travelTo,
    setReducedMotion: (v) => {
      reducedMotion = v;
    },
    destroy: () => {
      app.renderer.off("resize", layout);
      app.destroy(true, { children: true, texture: true });
    },
    rendererType: app.renderer.name ?? "webgl",
  };
}
