import { getBacklogs } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { BacklogClient, type BacklogItem } from "@/components/backlog-client";
import { SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BacklogsPage() {
  const user = await requireUser();
  const items = await getBacklogs(user.id);
  const payload: BacklogItem[] = items.map((i) => ({
    id: i.id,
    date: i.date,
    kind: i.kind,
    chapterName: i.chapterName,
    lectureIndex: i.lectureIndex,
    minutes: i.minutes,
    subjectName: i.subject?.name ?? "—",
    subjectColor: i.subject?.color ?? "var(--accent)",
    subjectIcon: i.subject?.icon ?? "book-open",
  }));

  return (
    <div className="page-enter space-y-7">
      <SectionHead
        eyebrow="Backlog rescue"
        title="Nothing hides here. Clear it, or re-plan it."
        sub="Lectures you missed, oldest first. Tick them as you catch up — or hit smart re-plan and the engine folds them back into your future schedule."
      />
      <BacklogClient items={payload} />
    </div>
  );
}
