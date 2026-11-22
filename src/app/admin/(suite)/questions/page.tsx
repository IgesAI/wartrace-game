import Link from "next/link";
import { listQuestions } from "@/modules/content/admin-queries";
import { getDb } from "@/server/db";

export default async function QuestionsPage() {
  const rows = await listQuestions(await getDb());
  return (
    <>
      <h1>Questions</h1>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Prompt</th>
              <th>Status</th>
              <th>Coverage</th>
              <th>Answers</th>
              <th>Aliases</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ q, answers, aliases }) => (
              <tr key={q.id}>
                <td className="hint">
                  {q.questionFamilyKey} v{q.version}
                </td>
                <td>
                  <Link href={`/admin/questions/${q.id}`}>{q.prompt}</Link>
                  {q.isDemo && <span className="badge badge-warn" style={{ marginLeft: 8 }}>demo</span>}
                </td>
                <td>
                  <span className="pill" data-v={q.editorialStatus}>
                    {q.editorialStatus}
                  </span>
                </td>
                <td className="hint">{q.coverageClass}</td>
                <td className="num">{answers}</td>
                <td className="num">{aliases}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
