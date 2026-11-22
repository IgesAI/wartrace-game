import { listAudit } from "@/modules/content/admin-queries";
import { getDb } from "@/server/db";

export default async function AuditPage() {
  const rows = await listAudit(await getDb());
  return (
    <>
      <h1>Audit log</h1>
      <p className="hint">Append-only: the database rejects updates and deletes on this table.</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>When (UTC)</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Subject</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ log, actor, role }) => (
              <tr key={log.id}>
                <td className="hint num">{log.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td>
                  {actor ?? "system"} {role && <span className="pill">{role}</span>}
                </td>
                <td>{log.action}</td>
                <td className="hint">
                  {log.subjectType} {log.subjectId.slice(0, 8)}
                </td>
                <td>{log.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
