import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/SiteFooter";
import { AppError } from "@/modules/domain/errors";
import { getRunState } from "@/modules/game/service";
import { runIdSchema } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { currentGuestId, gameConfig } from "@/server/http";
import { GameClient } from "./GameClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Operation in progress", robots: { index: false } };

export default async function GamePage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const guestId = await currentGuestId();
  const parsed = runIdSchema.safeParse(runId);
  let run = null;
  if (guestId && parsed.success) {
    try {
      run = await getRunState(await getDb(), parsed.data, guestId, gameConfig());
    } catch (e) {
      if (!(e instanceof AppError) || (e.status !== 404 && e.status !== 403)) throw e;
    }
  }
  if (!run) {
    return (
      <div className="page">
        <PageHeader />
        <main id="main" className="prose">
          <h1>Expedition not found</h1>
          <p>This run doesn&apos;t belong to this browser, or it has expired. Runs are tied to the device that started them.</p>
          <p>
            <Link className="btn" href="/daily">
              Play today&apos;s operation
            </Link>
          </p>
        </main>
      </div>
    );
  }
  return <GameClient initialRun={run} />;
}
