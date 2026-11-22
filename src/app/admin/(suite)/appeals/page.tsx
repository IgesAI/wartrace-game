import { can } from "@/modules/content/audit";
import { APPEAL_STATUSES } from "@/modules/db/schema";
import { listAppeals } from "@/modules/game/appeals";
import { getDb } from "@/server/db";
import { currentAdmin } from "@/server/http";
import { AppealTriage } from "./AppealTriage";

export default async function AppealsPage() {
  const [rows, admin] = await Promise.all([listAppeals(await getDb()), currentAdmin()]);
  const canTriage = can(admin, "triageAppeals");
  return (
    <>
      <h1>Appeals</h1>
      {rows.length === 0 ? (
        <p className="notice">No appeals yet.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Category</th>
                <th>Submitted</th>
                <th>Explanation</th>
                <th>Evidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="hint num">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td>{a.category}</td>
                  <td>{a.submittedText || <span className="hint">—</span>}</td>
                  <td style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>{a.explanation}</td>
                  <td>
                    {a.evidenceUrl ? (
                      <a href={a.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow ugc">
                        link
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <AppealTriage appealId={a.id} status={a.status} statuses={APPEAL_STATUSES} disabled={!canTriage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
