import Link from "next/link";
import { listOperations } from "@/modules/content/admin-queries";
import { lintOperation } from "@/modules/content/readiness";
import { dateKeyFor } from "@/modules/domain/dates";
import { getDb } from "@/server/db";
import { gameConfig } from "@/server/http";

export default async function AdminDashboard() {
  const db = await getDb();
  const cfg = gameConfig();
  const today = dateKeyFor(cfg.now, cfg.timeZone);
  const ops = await listOperations(db);
  const reports = await Promise.all(ops.map((o) => lintOperation(db, o.id)));
  const upcoming = ops.filter((o) => o.dateKey >= today && o.status === "published" && o.contentClass === "verified").length;
  return (
    <>
      <div>
        <h1>Operations</h1>
        <p className="hint">
          Today (America/New_York): <span className="num">{today}</span> · verified published queue from today: <strong>{upcoming}</strong> / 14 days required
          before broad launch
        </p>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>v</th>
              <th>Title</th>
              <th>Status</th>
              <th>Class</th>
              <th>Readiness</th>
              <th>Checksum</th>
            </tr>
          </thead>
          <tbody>
            {ops.map((o, i) => {
              const r = reports[i]!;
              const hard = r.blocking.filter((b) => !b.demoWaivable).length;
              return (
                <tr key={o.id}>
                  <td className="num">
                    <Link href={`/admin/operations/${o.id}`}>{o.dateKey}</Link>
                  </td>
                  <td className="num">{o.version}</td>
                  <td>{o.title}</td>
                  <td>
                    <span className="pill" data-v={o.status}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    {o.contentClass ? (
                      <span className="pill" data-v={o.contentClass}>
                        {o.contentClass}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {r.blocking.length === 0 ? (
                      <span className="pill" data-v="verified">
                        ready
                      </span>
                    ) : (
                      <span className="hint">
                        {hard} hard · {r.waivable.length} demo-waivable
                      </span>
                    )}
                  </td>
                  <td className="num hint">{o.contentChecksum ? `${o.contentChecksum.slice(0, 12)}…` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
