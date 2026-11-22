import type { Metadata } from "next";
import { PageHeader, SiteFooter } from "@/components/SiteFooter";
import { AppealForm } from "./AppealForm";

export const metadata: Metadata = { title: "Appeal an answer" };

export default async function AppealPage({ searchParams }: { searchParams: Promise<{ round?: string }> }) {
  const { round } = await searchParams;
  const valid = typeof round === "string" && /^[0-9a-f-]{36}$/i.test(round);
  return (
    <div className="page">
      <PageHeader />
      <main id="main" className="prose">
        <h1>Appeal an answer</h1>
        <p>
          Think a valid answer was rejected, an alias is ambiguous, or a source is wrong? Tell the editors. A human reviews every appeal; published scores
          for a day never change retroactively, but corrections apply to future versions.
        </p>
        {valid ? (
          <AppealForm runRoundId={round!} />
        ) : (
          <div className="notice">
            <p>Open an appeal from a round in your game or result ledger — each appeal is linked to the round you played.</p>
          </div>
        )}
        <p className="hint">Please don&apos;t include personal information. Only http(s) evidence links are accepted.</p>
      </main>
      <SiteFooter />
    </div>
  );
}
