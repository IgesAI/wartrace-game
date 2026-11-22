import { requireCapability } from "@/modules/content/audit";
import { listQuestions } from "@/modules/content/admin-queries";
import { getDb } from "@/server/db";
import { currentAdmin, handle, json } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  requireCapability(await currentAdmin(), "read");
  const rows = await listQuestions(await getDb());
  return json(
    rows.map((r) => ({
      id: r.q.id,
      familyKey: r.q.questionFamilyKey,
      version: r.q.version,
      prompt: r.q.prompt,
      topic: r.q.topic,
      status: r.q.editorialStatus,
      coverageClass: r.q.coverageClass,
      isDemo: r.q.isDemo,
      answers: r.answers,
      aliases: r.aliases,
    })),
  );
});
