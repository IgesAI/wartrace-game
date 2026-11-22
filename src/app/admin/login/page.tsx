import type { Metadata } from "next";
import { getEnv } from "@/server/env";
import { DevLogin } from "./DevLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false } };

export default function AdminLogin() {
  const env = getEnv();
  const mock = env.ADMIN_AUTH_PROVIDER === "development_mock_only" && env.WARTRACE_DEPLOY_ENV === "local";
  return (
    <div className="admin">
      <main id="main" className="admin-main" style={{ maxWidth: 560 }}>
        <h1>WARTRACE editorial</h1>
        {mock ? (
          <>
            <p className="draft-note">Local development sign-in. Pick a seeded role to exercise permissions. This mock is refused outside a local deployment.</p>
            <DevLogin />
          </>
        ) : (
          <p className="notice">No admin identity provider is configured for this deployment. An owner must choose and configure one (see docs/IMPLEMENTATION_DECISIONS.md).</p>
        )}
      </main>
    </div>
  );
}
