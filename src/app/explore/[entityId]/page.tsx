import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SiteFooter } from "@/components/SiteFooter";
import { getEntityEvidenceForGuest } from "@/modules/game/service";
import { runIdSchema } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { currentGuestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Evidence", robots: { index: false } };

export default async function ExplorePage({ params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params;
  const guestId = await currentGuestId();
  const ok = runIdSchema.safeParse(entityId).success;
  const e = guestId && ok ? await getEntityEvidenceForGuest(await getDb(), guestId, entityId) : null;
  return (
    <div className="page">
      <PageHeader />
      <main id="main" className="prose">
        {!e ? (
          <>
            <h1>Evidence unavailable</h1>
            <p>Evidence pages open for answers you&apos;ve locked in your own games, so the live answer list stays private.</p>
            <p>
              <Link href="/">Back to start</Link>
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">
              {e.topic} · {e.dateKey}
            </p>
            <h1>
              {e.canonicalName}
              {e.disambiguation ? ` (${e.disambiguation})` : ""}
            </h1>
            {e.contentClass === "demo" && <p className="draft-note">Demo content: candidate sources awaiting historian review.</p>}
            <p>
              <strong>Prompt:</strong> {e.prompt}
            </p>
            <p>
              <strong>Why it counts:</strong> {e.inclusionRationale}
            </p>
            <p>
              <strong>Tier:</strong> <span className="tier" data-tier={e.tier}>{e.tier}</span> · <strong>Evidence status:</strong> {e.evidenceStatus}
            </p>
            <h2>Sources</h2>
            {e.evidence.length === 0 ? (
              <p>No sources recorded.</p>
            ) : (
              <ul className="sources">
                {e.evidence.map((s) => (
                  <li key={s.url} className="source-card">
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                    <span className="meta">
                      {s.publisher ?? "Unknown publisher"} · Tier {s.sourceTier} · {s.reviewStatus}
                      {s.retrievedAt ? ` · retrieved ${s.retrievedAt.slice(0, 10)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p>
              <Link href="/support">Spotted an error?</Link>
            </p>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
