import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { can } from "@/modules/content/audit";
import { operationQuestionsFor } from "@/modules/content/admin-queries";
import { lintOperation } from "@/modules/content/readiness";
import { dailyOperations } from "@/modules/db/schema";
import { runIdSchema } from "@/modules/shared/api";
import { getDb } from "@/server/db";
import { demoContentAllowed } from "@/server/env";
import { currentAdmin } from "@/server/http";
import { OperationActions } from "./OperationActions";

export default async function OperationDetail({ params }: { params: Promise<{ operationId: string }> }) {
  const { operationId } = await params;
  if (!runIdSchema.safeParse(operationId).success) notFound();
  const db = await getDb();
  const [op] = await db.select().from(dailyOperations).where(eq(dailyOperations.id, operationId));
  if (!op) notFound();
  const [report, questions, admin] = await Promise.all([lintOperation(db, op.id), operationQuestionsFor(db, op.id), currentAdmin()]);
  const hard = report.blocking.filter((b) => !b.demoWaivable);
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <p className="hint">
            <Link href="/admin">← Operations</Link>
          </p>
          <h1>
            {op.dateKey} · {op.title} <span className="hint">v{op.version}</span>
          </h1>
          <p className="row" style={{ marginTop: 8 }}>
            <span className="pill" data-v={op.status}>
              {op.status}
            </span>
            {op.contentClass && (
              <span className="pill" data-v={op.contentClass}>
                {op.contentClass}
              </span>
            )}
            <span className="hint num">checksum: {op.contentChecksum ?? "not frozen"}</span>
          </p>
        </div>
      </div>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>Readiness gate</h2>
        <p className="hint">
          {report.stats.questions} questions · {report.stats.eligibleAnswers} answers · {report.stats.aliases} aliases · {report.stats.sourcedAnswers} sourced ·
          tiers {Object.entries(report.stats.tierCounts).map(([k, v]) => `${k} ${v}`).join(", ")}
          {report.stats.pointsRange ? ` · points ${report.stats.pointsRange[0]}–${report.stats.pointsRange[1]}` : ""}
        </p>
        {report.issues.length === 0 ? (
          <p className="notice">No issues. Eligible for verified publication.</p>
        ) : (
          <ul className="issue-list">
            {report.issues.map((i, k) => (
              <li key={k} data-severity={i.severity} data-waivable={!!i.demoWaivable}>
                <strong>{i.code}</strong>
                {i.roundIndex ? ` · round ${i.roundIndex}` : ""} — {i.message}
                {i.demoWaivable ? <span className="badge badge-warn" style={{ marginLeft: 8 }}>demo-waivable</span> : null}
              </li>
            ))}
          </ul>
        )}
        <p className="hint">
          {hard.length} hard blockers · {report.waivable.length} demo-waivable · demo publishing in this environment:{" "}
          <strong>{demoContentAllowed() ? "allowed (labelled)" : "refused"}</strong>
        </p>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <h2>Rounds</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Prompt</th>
                <th>Status</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((r) => (
                <tr key={r.roundIndex}>
                  <td className="num">{r.roundIndex}</td>
                  <td>
                    <Link href={`/admin/questions/${r.q.id}`}>{r.q.prompt}</Link>
                    {r.q.isDemo && <span className="badge badge-warn" style={{ marginLeft: 8 }}>demo</span>}
                  </td>
                  <td>
                    <span className="pill" data-v={r.q.editorialStatus}>
                      {r.q.editorialStatus}
                    </span>
                  </td>
                  <td className="hint">{r.q.coverageClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <OperationActions
        operationId={op.id}
        status={op.status}
        canPublish={can(admin, "publish")}
        hardBlockers={hard.length}
        waivable={report.waivable.length}
        demoAllowed={demoContentAllowed()}
      />
    </>
  );
}
