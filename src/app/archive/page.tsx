import type { Metadata } from "next";
import { and, desc, eq, lt } from "drizzle-orm";
import { PageHeader, SiteFooter } from "@/components/SiteFooter";
import { dailyOperations } from "@/modules/db/schema";
import { dateKeyFor } from "@/modules/domain/dates";
import { getDb } from "@/server/db";
import { gameConfig } from "@/server/http";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archive" };

export default async function ArchivePage() {
  const cfg = gameConfig();
  const today = dateKeyFor(cfg.now, cfg.timeZone);
  const db = await getDb();
  const past = await db
    .select({ dateKey: dailyOperations.dateKey, title: dailyOperations.title, contentClass: dailyOperations.contentClass })
    .from(dailyOperations)
    .where(and(eq(dailyOperations.status, "published"), lt(dailyOperations.dateKey, today)))
    .orderBy(desc(dailyOperations.dateKey))
    .limit(60);
  const visible = past.filter((p) => p.contentClass === "verified" || cfg.demoAllowed);
  return (
    <div className="page">
      <PageHeader />
      <main id="main" className="prose">
        <h1>Archive</h1>
        <p>Every daily operation is played once, on its day. Replaying past operations — with answer explanations — is planned for a later release.</p>
        {visible.length === 0 ? (
          <p className="notice">No past operations yet.</p>
        ) : (
          <ul>
            {visible.map((p) => (
              <li key={p.dateKey}>
                <span className="num">{p.dateKey}</span> — {p.title}
                {p.contentClass === "demo" ? " (demo)" : ""}
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
