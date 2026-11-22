import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signValue(payload: string, secret: string): string {
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the payload if the HMAC verifies, else null. Constant-time comparison. */
export function verifySignedValue(value: string | undefined | null, secret: string): string | null {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i <= 0) return null;
  const payload = value.slice(0, i);
  const given = Buffer.from(value.slice(i + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return payload;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
