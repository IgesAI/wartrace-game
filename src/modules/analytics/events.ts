import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const bucket = z.enum(["lt5s", "5to10s", "10to20s", "gt20s"]);
const outcome = z.enum(["valid", "invalid", "timed_out", "ambiguous"]);
const tier = z.enum(["Common", "Curious", "Uncommon", "Obscure", "None"]);

/**
 * Event contract (docs/08_ANALYTICS_AND_KPIS.md, specs/analytics_events.json).
 * Every schema is strict and enum/number-only so raw answers, tokens or IDs cannot be recorded.
 */
export const EVENT_SCHEMAS = {
  landing_viewed: z.object({ viewport: z.enum(["mobile", "tablet", "desktop"]), reducedMotion: z.boolean() }),
  daily_cta_clicked: z.object({ challengeDate: dateKey, source: z.enum(["direct", "challenge_link"]) }),
  game_started: z.object({ challengeDate: dateKey, platform: z.enum(["mobile", "tablet", "desktop"]) }),
  round_started: z.object({ roundIndex: z.number().int().min(1).max(7), category: z.string().max(40) }),
  answer_submitted: z.object({
    roundIndex: z.number().int().min(1).max(7),
    outcome,
    rarityTier: tier,
    score: z.number().int().min(0).max(1000),
    distanceM: z.number().int().min(0).max(800),
    elapsedMsBucket: bucket,
  }),
  round_completed: z.object({ roundIndex: z.number().int().min(1).max(7), animationSkipped: z.boolean(), renderer: z.enum(["pixi", "svg-fallback"]) }),
  game_completed: z.object({ score: z.number().int().min(0).max(7000), distanceM: z.number().int().min(0).max(5600), roundsCorrect: z.number().int().min(0).max(7) }),
  share_card_created: z.object({ format: z.enum(["square", "og", "vertical_webm"]) }),
  share_intent: z.object({ medium: z.enum(["copy_link", "native_share", "download_card", "download_video"]) }),
  challenge_link_opened: z.object({ challengeDate: dateKey, channel: z.enum(["link"]), referralTokenPresent: z.boolean() }),
  referral_game_started: z.object({ challengeDate: dateKey }),
  result_viewed: z.object({ ownResult: z.boolean() }),
  source_card_opened: z.object({ category: z.string().max(40), sourceTier: z.enum(["A", "B", "C", "D"]) }),
  answer_appeal_submitted: z.object({ category: z.enum(["missing_valid_answer", "ambiguous_alias", "incorrect_source", "other"]) }),
  renderer_fallback_used: z.object({ reason: z.enum(["webgl_unavailable", "init_failed"]) }),
  client_error: z.object({ code: z.string().regex(/^[A-Z_]{2,40}$/), page: z.enum(["home", "game", "results", "other"]) }),
} as const;

export type EventName = keyof typeof EVENT_SCHEMAS;

export const eventEnvelope = z
  .object({ name: z.string(), props: z.record(z.string(), z.unknown()), challengeDate: dateKey.optional() })
  .strict();

export function validateEvent(input: unknown): { name: EventName; props: Record<string, unknown>; challengeDate?: string } | null {
  const env = eventEnvelope.safeParse(input);
  if (!env.success || !(env.data.name in EVENT_SCHEMAS)) return null;
  const name = env.data.name as EventName;
  const props = EVENT_SCHEMAS[name].strict().safeParse(env.data.props);
  if (!props.success) return null;
  return { name, props: props.data as Record<string, unknown>, challengeDate: env.data.challengeDate };
}

export function elapsedBucket(ms: number): z.infer<typeof bucket> {
  return ms < 5000 ? "lt5s" : ms < 10000 ? "5to10s" : ms < 20000 ? "10to20s" : "gt20s";
}
