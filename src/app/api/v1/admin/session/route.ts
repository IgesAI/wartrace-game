import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_COOKIE, issueAdminCookie } from "@/modules/auth/admin";
import { adminUsers } from "@/modules/db/schema";
import { AppError } from "@/modules/domain/errors";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { assertSameOrigin, handle, json, parseBody, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

const body = z.object({ subject: z.string().regex(/^dev:[a-z]+$/) }).strict();

/** Development-mock sign-in. Refused anywhere except a local deployment; production env validation also rejects the mock provider. */
export const POST = handle(async (req) => {
  await assertSameOrigin(true);
  await rateLimit("admin");
  const env = getEnv();
  if (env.ADMIN_AUTH_PROVIDER !== "development_mock_only" || env.WARTRACE_DEPLOY_ENV !== "local") {
    throw new AppError("FORBIDDEN", 403, "Mock admin sign-in is available only in local development");
  }
  const { subject } = await parseBody(req, body);
  const [user] = await (await getDb()).select().from(adminUsers).where(eq(adminUsers.authSubject, subject));
  if (!user || !user.active) throw new AppError("FORBIDDEN", 403, "Unknown development admin");
  const cookie = issueAdminCookie(user.id, env.adminSecret);
  (await cookies()).set(ADMIN_COOKIE, cookie.value, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "strict",
    path: "/",
    expires: cookie.expires,
  });
  return json({ role: user.role, displayName: user.displayName });
});

export const DELETE = handle(async () => {
  await assertSameOrigin(true);
  (await cookies()).delete(ADMIN_COOKIE);
  return new Response(null, { status: 204 });
});
