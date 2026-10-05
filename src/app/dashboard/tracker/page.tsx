import { getTrackerData } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { TrackerClient, type TrackerSubject } from "@/components/tracker-client";
import { SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TrackerPage() {
  const user = await requireUser();
  const { stats, itemsByChapter, today } = await getTrackerData(user.id);

  const subjects: TrackerSubject[] = stats.bySubject.map((s) => ({
    id: s.subject.id,
    name: s.subject.name,
    color: s.subject.color,
    icon: s.subject.icon,
    teachers: s.teachers,
    doneLectures: s.doneLectures,
    totalLectures: s.totalLectures,
    chapters: s.chapters.map((c) => {
      const items = (itemsByChapter.get(c.id) ?? []).sort((a, b) =>
        a.date === b.date ? a.lectureIndex - b.lectureIndex : a.date < b.date ? -1 : 1
      );
      const known = items.length;
      const pills = items.map((i) => ({
        id: i.id,
        index: i.lectureIndex,
        done: i.status === "done",
        today: i.date === today,
        backlog: i.date < today && i.status !== "done",
      }));
      // chapters whose remaining lectures didn't fit into the plan horizon
      for (let k = known; k < c.totalLectures; k++) {
        pills.push({ id: -1, index: k + 1, done: c.doneLectures > k, today: false, backlog: false });
      }
      return {
        id: c.id,
        name: c.name,
        cls: c.classLevel,
        total: c.totalLectures,
        done: c.doneLectures,
        archived: !c.active,
        pills,
      };
    }),
  }));

  return (
    <div className="page-enter space-y-7">
      <SectionHead
        eyebrow="Syllabus tracker"
        title="Every chapter, every lecture, one tap away."
        sub="Tap a pill the moment you finish a lecture. Red pills are backlogs — don't let them age."
      />
      <TrackerClient subjects={subjects} />
    </div>
  );
}
