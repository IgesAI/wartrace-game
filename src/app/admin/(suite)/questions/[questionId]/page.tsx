import Link from "next/link";
import { notFound } from "next/navigation";
import { questionDetail } from "@/modules/content/admin-queries";
import { awardForRarity } from "@/modules/domain/scoring";
import { runIdSchema } from "@/modules/shared/api";
import { getDb } from "@/server/db";

export default async function QuestionDetail({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  if (!runIdSchema.safeParse(questionId).success) notFound();
  const d = await questionDetail(await getDb(), questionId);
  if (!d) notFound();
  const { q, answers, aliases, evidence } = d;
  return (
    <>
      <p className="hint">
        <Link href="/admin/questions">← Questions</Link>
      </p>
      <h1>{q.prompt}</h1>
      <p className="row">
        <span className="pill" data-v={q.editorialStatus}>
          {q.editorialStatus}
        </span>
        <span className="hint">
          {q.questionFamilyKey} v{q.version} · {q.topic} · {q.coverageClass}
        </span>
        {q.isDemo && <span className="badge badge-warn">demo — candidate content</span>}
      </p>
      <div className="notice">
        <p>
          <strong>Eligibility rules (internal):</strong> {q.internalEligibilityRules || "— missing —"}
        </p>
        {q.coverageNote && (
          <p>
            <strong>Coverage note:</strong> {q.coverageNote}
          </p>
        )}
      </div>
      <h2>Eligible answers</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Rarity</th>
              <th>Award</th>
              <th>Evidence status</th>
              <th>Aliases</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            {answers.map(({ e, entity }) => {
              const award = awardForRarity(e.rarityScore);
              const al = aliases.filter((a) => a.entityId === e.entityId);
              const ev = evidence.filter((x) => x.link.entityId === e.entityId);
              return (
                <tr key={e.entityId}>
                  <td>
                    <strong>{entity.canonicalName}</strong>
                    {entity.disambiguation ? <span className="hint"> ({entity.disambiguation})</span> : null}
                    <div className="hint">{e.inclusionRationale}</div>
                  </td>
                  <td className="num">{e.rarityScore.toFixed(2)}</td>
                  <td className="num">
                    {award.points} / {award.distanceM}m · {award.tier}
                  </td>
                  <td>
                    <span className="pill" data-v={e.evidenceStatus}>
                      {e.evidenceStatus}
                    </span>
                  </td>
                  <td className="hint">{al.map((a) => a.displayAlias).join(", ") || "—"}</td>
                  <td>
                    {ev.length === 0 ? (
                      <span className="badge badge-warn">no source</span>
                    ) : (
                      ev.map((x) => (
                        <div key={x.src.id}>
                          <a href={x.src.sourceUrl} target="_blank" rel="noopener noreferrer">
                            {x.src.title}
                          </a>{" "}
                          <span className="hint">
                            tier {x.src.sourceTier} · {x.src.reviewStatus}
                          </span>
                        </div>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
