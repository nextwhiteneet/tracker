import { addDays, dayOfWeek, todayStr } from "./utils";

/* ------------------------------------------------------------------ */
/* Planner engine: turns the student's configuration into a day-by-day */
/* plan of lectures + weekly revision slots. Pure & shared client/server. */
/* ------------------------------------------------------------------ */

export interface EngineSubject {
  id: number;
  lectureLength: number;
  chapters: Array<{ id: number; totalLectures: number }>; // active only, in order
}

export interface EngineRoutineEntry {
  dayOfWeek: number; // 0..6
  subjectId: number;
  lectures: number;
}

export interface EngineOptions {
  today: string; // YYYY-MM-DD anchor
  startDate: string; // plan never starts before today or this date
  speed: number;
  style: string; // steady | intense | chill
  revisionEnabled: boolean;
  revisionDay: number; // 0..6
  revisionMinutes: number; // minutes reserved that day (split across subjects)
  subjects: EngineSubject[];
  routine: EngineRoutineEntry[];
  /** lectures already completed per chapter (id -> count) */
  doneByChapter: Record<number, number>;
  /** chapters whose revision round was already ticked */
  revisedChapterIds: Set<number>;
  maxDays?: number;
}

export interface GeneratedItem {
  date: string;
  subjectId: number;
  chapterId: number | null;
  lectureIndex: number;
  minutes: number;
  kind: "lecture" | "revision";
}

function styleBoost(style: string, dow: number, lectures: number): number {
  // intense: heavier on weekends; chill: lighter Fridays
  if (style === "intense" && (dow === 0 || dow === 6)) return lectures + 1;
  if (style === "chill" && dow === 5) return Math.max(0, lectures - 1);
  return lectures;
}

export function generatePlan(opts: EngineOptions): GeneratedItem[] {
  const items: GeneratedItem[] = [];
  const start = opts.startDate > opts.today ? opts.startDate : opts.today;
  const maxDays = Math.min(opts.maxDays ?? 500, 730);

  // Remaining lecture queue per subject
  const queues = new Map<number, Array<{ chapterId: number; lectureIndex: number }>>();
  // Chapters pending revision (fully scheduled but never revision-ticked)
  const revisionQueue = new Map<number, number[]>();
  const scheduleMarksRevision = new Map<number, Set<number>>();

  for (const s of opts.subjects) {
    const q: Array<{ chapterId: number; lectureIndex: number }> = [];
    for (const ch of s.chapters) {
      const done = opts.doneByChapter[ch.id] ?? 0;
      for (let i = done + 1; i <= ch.totalLectures; i++) {
        q.push({ chapterId: ch.id, lectureIndex: i });
      }
      const scheduledBefore = done;
      if (
        scheduledBefore >= ch.totalLectures &&
        ch.totalLectures > 0 &&
        !opts.revisedChapterIds.has(ch.id)
      ) {
        // already finished chapter → revision candidate immediately
        (revisionQueue.get(s.id) ?? revisionQueue.set(s.id, []).get(s.id)!).push(ch.id);
      }
    }
    queues.set(s.id, q);
    if (!scheduleMarksRevision.has(s.id)) scheduleMarksRevision.set(s.id, new Set());
  }

  let date = start;
  let remaining = countRemaining(queues);

  for (let i = 0; i < maxDays && remaining > 0; i++) {
    const dow = dayOfWeek(date);

    if (opts.revisionEnabled && dow === opts.revisionDay) {
      // Revision day: pop up to one pending-revision chapter per subject.
      const due: Array<{ subjectId: number; chapterId: number }> = [];
      revisionQueue.forEach((chIds, subjectId) => {
        while (chIds.length && scheduleMarksRevision.get(subjectId)?.has(chIds[0])) chIds.shift();
        if (chIds.length) due.push({ subjectId, chapterId: chIds[0] });
      });
      if (due.length) {
        const per = Math.max(20, Math.round(opts.revisionMinutes / due.length));
        for (const d of due) {
          revisionQueue.get(d.subjectId)!.shift();
          items.push({
            date,
            subjectId: d.subjectId,
            chapterId: d.chapterId,
            lectureIndex: 0,
            minutes: per,
            kind: "revision",
          });
        }
      }
      // Also allow a light lecture load on revision day? No — keep it clean.
      date = addDays(date, 1);
      continue;
    }

    const todays = opts.routine.filter((r) => r.dayOfWeek === dow);
    for (const r of todays) {
      const queue = queues.get(r.subjectId);
      const subj = opts.subjects.find((s) => s.id === r.subjectId);
      if (!queue || !subj) continue;
      let count = styleBoost(opts.style, dow, r.lectures);
      const minutesPer = Math.max(15, Math.round(subj.lectureLength / opts.speed));
      while (count-- > 0 && queue.length) {
        const next = queue.shift()!;
        remaining--;
        items.push({
          date,
          subjectId: r.subjectId,
          chapterId: next.chapterId,
          lectureIndex: next.lectureIndex,
          minutes: minutesPer,
          kind: "lecture",
        });
        const q = queues.get(r.subjectId)!;
        const isLastOfChapter = !q.some((x) => x.chapterId === next.chapterId);
        if (isLastOfChapter && opts.revisionEnabled && !opts.revisedChapterIds.has(next.chapterId)) {
          (revisionQueue.get(r.subjectId) ?? revisionQueue.set(r.subjectId, []).get(r.subjectId)!).push(
            next.chapterId
          );
        }
      }
    }

    date = addDays(date, 1);
  }

  return items;
}

function countRemaining(queues: Map<number, Array<unknown>>): number {
  let n = 0;
  queues.forEach((q) => (n += q.length));
  return n;
}

/** Summary stats of a generated set of items (used for preview + review step). */
export function summarizeItems(items: GeneratedItem[]) {
  const lectures = items.filter((i) => i.kind === "lecture");
  const revisions = items.filter((i) => i.kind === "revision");
  const finishDate = items.length ? items[items.length - 1].date : todayStr();
  const totalMinutes = lectures.reduce((a, i) => a + i.minutes, 0);
  const byDate = new Map<string, number>();
  for (const i of items) byDate.set(i.date, (byDate.get(i.date) ?? 0) + i.minutes);
  const activeDays = byDate.size;
  return {
    totalLectures: lectures.length,
    totalRevisions: revisions.length,
    finishDate,
    totalMinutes,
    activeDays,
    avgMinutesPerActiveDay: activeDays ? Math.round(totalMinutes / activeDays) : 0,
  };
}
