import { getRevisionData, getStats } from "@/lib/data";
import { SectionHead } from "@/components/ui";
import { RevisionClient, type RevChapter } from "@/components/revision-client";

export const dynamic = "force-dynamic";

export default async function RevisionPage() {
  const [{ completed, inProgress, revMap, doneMap }, stats] = await Promise.all([
    getRevisionData(),
    getStats(),
  ]);

  const subjectOf = (subjectId: number) =>
    stats.bySubject.find((s) => s.subject.id === subjectId);

  const payload: RevChapter[] = completed.map((c) => {
    const s = subjectOf(c.subjectId)?.subject;
    const r = revMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      cls: c.classLevel,
      subjectName: s?.name ?? "",
      subjectColor: s?.color ?? "var(--accent)",
      subjectIcon: s?.icon ?? "book-open",
      rounds: r?.rounds ?? 0,
      confidence: r?.confidence ?? 0,
      lastRevisedOn: r?.lastRevisedOn ?? null,
    };
  });

  const inProg = inProgress.map((c) => ({
    id: c.id,
    name: c.name,
    done: doneMap.get(c.id) ?? 0,
    total: c.totalLectures,
    subjectName: subjectOf(c.subjectId)?.subject.name ?? "",
    subjectColor: subjectOf(c.subjectId)?.subject.color ?? "var(--accent)",
  }));

  return (
    <div className="page-enter space-y-7">
      <SectionHead
        eyebrow="Revision vault"
        title="Finishing a chapter is half the job. Keeping it is the other half."
        sub="Completed chapters queue here. Log each revision round and rate your confidence — weak ones rise to the top."
      />
      <RevisionClient completed={payload} inProgress={inProg} />
    </div>
  );
}
