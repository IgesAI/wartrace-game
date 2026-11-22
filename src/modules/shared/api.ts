import { z } from "zod";

export const runIdSchema = z.string().uuid();
export const roundIndexSchema = z.coerce.number().int().min(1).max(7);

export const startRunBody = z.object({ referred: z.boolean().optional() }).strict();

export const submitBody = z
  .object({
    answer: z.string().max(480),
    idempotencyKey: z.string().uuid(),
    entityChoice: z.string().uuid().nullish(),
  })
  .strict();

export type ApiError = { error: { code: string; message: string; requestId: string; details?: unknown } };
