import { db } from "@/db";
import {
  profiles,
  subjects,
  teachers,
  chapters,
  routine,
  planItems,
  revisions,
  focusSessions,
  dayNotes,
  type Profile,
  type Subject,
  type Chapter,
  type PlanItem,
} from "@/db/schema";
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";
import { addDays, diffDays, fmtMinutes, todayStr } from "./utils";
import { generatePlan, type GeneratedItem } from "./planner";
import { DEFAULT_SYLLABUS, defaultExamDate } from "./syllabus";

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

export async function getProfile(userId: number): Promise<Profile> {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (rows.length) return rows[0];
  const today = todayStr();
  // Race-safe bootstrap: one profile row per user (unique on user_id)
  await db
    .insert(profiles)
    .values({ userId, name: "", examDate: defaultExamDate(), startDate: today })
    .onConflictDoNothing();
  const again = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return again[0];
}

/* ------------------------------------------------------------------ */
/* Full config (used by wizard, settings, plan regen)                  */
/* ------------------------------------------------------------------ */

export interface SubjectConfig {
  id: number;
  key: string;
  name: string;
  color: string;
  icon: string;
  lectureLength: number;
  teachers: string[];
  chapters: ChapterConfig[];
}

export interface ChapterConfig {
  id: number;
  name: string;
  cls: number;
  lectures: number;
  active: boolean;
  doneLectures: number;
}

export interface RoutineConfig {
  dayOfWeek: number;
  subjectId: number;
  subjectKey: string;
  lectures: number;
}

export interface PlannerConfig {
  profile: Profile;
  subjects: SubjectConfig[];
  routine: RoutineConfig[];
  isEmpty: boolean;
}

export async function getConfig(userId: number): Promise<PlannerConfig> {
  const [profile, subs, tchs, chps, rout, items] = await Promise.all([
    getProfile(userId),
    db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.orderIndex)),
    db.select().from(teachers).where(eq(teachers.userId, userId)),
    db.select().from(chapters).where(eq(chapters.userId, userId)).orderBy(asc(chapters.orderIndex)),
    db.select().from(routine).where(eq(routine.userId, userId)),
    db.select({ chapterId: planItems.chapterId })
      .from(planItems)
      .where(and(eq(planItems.userId, userId), eq(planItems.status, "done"), eq(planItems.kind, "lecture"))),
  ]);

  const doneMap = new Map<number, number>();
  for (const r of items) {
    if (r.chapterId != null) doneMap.set(r.chapterId, (doneMap.get(r.chapterId) ?? 0) + 1);
  }

  const subjectConfigs: SubjectConfig[] = subs.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    color: s.color,
    icon: s.icon,
    lectureLength: s.lectureLength,
    teachers: tchs.filter((t) => t.subjectId === s.id).map((t) => t.name),
    chapters: chps
      .filter((c) => c.subjectId === s.id)
      .map((c) => ({
        id: c.id,
        name: c.name,
        cls: c.classLevel,
        lectures: c.totalLectures,
        active: c.active,
        doneLectures: doneMap.get(c.id) ?? 0,
      })),
  }));

  const keyOf = new Map(subs.map((s) => [s.id, s.key]));
  return {
    profile,
    subjects: subjectConfigs,
    routine: rout.map((r) => ({
      dayOfWeek: r.dayOfWeek,
      subjectId: r.subjectId,
      subjectKey: keyOf.get(r.subjectId) ?? "",
      lectures: r.lectures,
    })),
    isEmpty: subs.length === 0,
  };
}

export interface SaveSubjectInput {
  id?: number;
  key: string;
  name: string;
  color: string;
  icon: string;
  lectureLength: number;
  teachers: string[];
  chapters: Array<{ id?: number; name: string; cls: number; lectures: number; active: boolean }>;
}

export interface SaveConfigInput {
  profile: {
    name: string;
    motto: string;
    examDate: string;
    startDate: string;
    dailyTargetMinutes: number;
    speed: number;
    style: string;
    revisionEnabled: boolean;
    revisionDay: number;
    revisionMinutes: number;
  };
  subjects: SaveSubjectInput[];
  routine: Array<{ dayOfWeek: number; subjectKey: string; lectures: number }>;
  setupCompleted: boolean;
}

export async function saveConfig(userId: number, input: SaveConfigInput): Promise<void> {
  // 1. Profile
  await db
    .insert(profiles)
    .values({
      userId,
      name: input.profile.name,
      motto: input.profile.motto,
      examDate: input.profile.examDate,
      startDate: input.profile.startDate,
      dailyTargetMinutes: input.profile.dailyTargetMinutes,
      speed: input.profile.speed.toFixed(2),
      style: input.profile.style,
      revisionEnabled: input.profile.revisionEnabled,
      revisionDay: input.profile.revisionDay,
      revisionMinutes: input.profile.revisionMinutes,
      setupCompleted: input.setupCompleted,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        name: input.profile.name,
        motto: input.profile.motto,
        examDate: input.profile.examDate,
        startDate: input.profile.startDate,
        dailyTargetMinutes: input.profile.dailyTargetMinutes,
        speed: input.profile.speed.toFixed(2),
        style: input.profile.style,
        revisionEnabled: input.profile.revisionEnabled,
        revisionDay: input.profile.revisionDay,
        revisionMinutes: input.profile.revisionMinutes,
        setupCompleted: input.setupCompleted,
      },
    });

  // 2. Subjects (identity by key)
  const existingSubs = await db.select().from(subjects).where(eq(subjects.userId, userId));
  const incomingKeys = new Set(input.subjects.map((s) => s.key));
  const removedSubs = existingSubs.filter((s) => !incomingKeys.has(s.key));
  if (removedSubs.length) {
    const removedIds = removedSubs.map((s) => s.id);
    await db.delete(teachers).where(inArray(teachers.subjectId, removedIds));
    await db.delete(chapters).where(inArray(chapters.subjectId, removedIds));
    await db.delete(routine).where(inArray(routine.subjectId, removedIds));
    await db.delete(planItems).where(inArray(planItems.subjectId, removedIds));
    await db.delete(subjects).where(inArray(subjects.id, removedIds));
  }

  const keyToId = new Map<number | string, number>();
  for (let i = 0; i < input.subjects.length; i++) {
    const s = input.subjects[i];
    let subjectId: number;
    const existing = existingSubs.find((e) => e.key === s.key);
    if (existing) {
      subjectId = existing.id;
      await db
        .update(subjects)
        .set({
          name: s.name,
          color: s.color,
          icon: s.icon,
          lectureLength: s.lectureLength,
          orderIndex: i,
        })
        .where(eq(subjects.id, subjectId));
    } else {
      const ins = await db
        .insert(subjects)
        .values({
          userId,
          key: s.key,
          name: s.name,
          color: s.color,
          icon: s.icon,
          lectureLength: s.lectureLength,
          orderIndex: i,
        })
        .returning();
      subjectId = ins[0].id;
    }
    keyToId.set(s.key, subjectId);

    // Teachers: replace per subject
    await db.delete(teachers).where(eq(teachers.subjectId, subjectId));
    if (s.teachers.length) {
      await db.insert(teachers).values(
        s.teachers.filter(Boolean).map((name) => ({ userId, subjectId, name }))
      );
    }

    // Chapters
    const existingChaps = await db
      .select()
      .from(chapters)
      .where(eq(chapters.subjectId, subjectId));
    const incomingIds = new Set(s.chapters.filter((c) => c.id).map((c) => c.id!));
    const removedChaps = existingChaps.filter((c) => !incomingIds.has(c.id));
    for (const rc of removedChaps) {
      const doneRows = await db
        .select({ id: planItems.id })
        .from(planItems)
        .where(and(eq(planItems.chapterId, rc.id), eq(planItems.status, "done")))
        .limit(1);
      if (doneRows.length) {
        // Preserve history: archive instead of deleting
        await db.update(chapters).set({ active: false }).where(eq(chapters.id, rc.id));
        await db
          .delete(planItems)
          .where(and(eq(planItems.chapterId, rc.id), eq(planItems.status, "pending")));
      } else {
        await db.delete(planItems).where(eq(planItems.chapterId, rc.id));
        await db.delete(revisions).where(eq(revisions.chapterId, rc.id));
        await db.delete(chapters).where(eq(chapters.id, rc.id));
      }
    }

    for (let j = 0; j < s.chapters.length; j++) {
      const c = s.chapters[j];
      if (c.id && existingChaps.some((e) => e.id === c.id)) {
        await db
          .update(chapters)
          .set({ name: c.name, classLevel: c.cls, totalLectures: c.lectures, orderIndex: j, active: c.active })
          .where(eq(chapters.id, c.id));
      } else {
        await db
          .insert(chapters)
          .values({ userId, subjectId, name: c.name, classLevel: c.cls, totalLectures: c.lectures, orderIndex: j, active: c.active });
      }
    }
  }

  // 3. Routine: replace all
  await db.delete(routine).where(eq(routine.userId, userId));
  const routineRows = input.routine
    .map((r) => ({
      userId,
      dayOfWeek: r.dayOfWeek,
      subjectId: keyToId.get(r.subjectKey),
      lectures: Math.min(12, Math.max(1, r.lectures)),
    }))
    .filter((r) => r.subjectId != null) as Array<{ userId: number; dayOfWeek: number; subjectId: number; lectures: number }>;
  if (routineRows.length) await db.insert(routine).values(routineRows);

  // 4. Rebuild pending plan items
  await regeneratePlan(userId);
}

/* ------------------------------------------------------------------ */
/* Plan regeneration                                                   */
/* ------------------------------------------------------------------ */

export async function regeneratePlan(userId: number): Promise<{ inserted: number }> {
  const profile = await getProfile(userId);
  const [subs, chps, rout, doneRows, revisedRows, chapterNames] = await Promise.all([
    db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.orderIndex)),
    db.select().from(chapters).where(and(eq(chapters.userId, userId), eq(chapters.active, true))).orderBy(asc(chapters.orderIndex)),
    db.select().from(routine).where(eq(routine.userId, userId)),
    db
      .select({ chapterId: planItems.chapterId, n: sql<number>`count(*)::int` })
      .from(planItems)
      .where(and(eq(planItems.userId, userId), eq(planItems.status, "done"), eq(planItems.kind, "lecture")))
      .groupBy(planItems.chapterId),
    db
      .select({ chapterId: planItems.chapterId })
      .from(planItems)
      .where(and(eq(planItems.userId, userId), eq(planItems.status, "done"), eq(planItems.kind, "revision")))
      .groupBy(planItems.chapterId),
    db.select({ id: chapters.id, name: chapters.name }).from(chapters).where(eq(chapters.userId, userId)),
  ]);

  const doneByChapter: Record<number, number> = {};
  for (const r of doneRows) if (r.chapterId != null) doneByChapter[r.chapterId] = r.n;
  const revisedChapterIds = new Set(revisedRows.map((r) => r.chapterId).filter((x): x is number => x != null));
  const nameOf = new Map(chapterNames.map((c) => [c.id, c.name]));

  const generated: GeneratedItem[] = generatePlan({
    today: todayStr(),
    startDate: profile.startDate || todayStr(),
    speed: Number(profile.speed) || 1,
    style: profile.style,
    revisionEnabled: profile.revisionEnabled,
    revisionDay: profile.revisionDay,
    revisionMinutes: profile.revisionMinutes,
    subjects: subs.map((s) => ({
      id: s.id,
      lectureLength: s.lectureLength,
      chapters: chps
        .filter((c) => c.subjectId === s.id)
        .map((c) => ({ id: c.id, totalLectures: c.totalLectures })),
    })),
    routine: rout.map((r) => ({ dayOfWeek: r.dayOfWeek, subjectId: r.subjectId, lectures: r.lectures })),
    doneByChapter,
    revisedChapterIds,
  });

  await db.delete(planItems).where(and(eq(planItems.userId, userId), eq(planItems.status, "pending")));
  if (generated.length) {
    await db.insert(planItems).values(
      generated.map((g) => ({
        userId,
        date: g.date,
        subjectId: g.subjectId,
        chapterId: g.chapterId,
        chapterName: g.chapterId != null ? nameOf.get(g.chapterId) ?? "" : "",
        lectureIndex: g.lectureIndex,
        minutes: g.minutes,
        kind: g.kind,
      }))
    );
  }
  return { inserted: generated.length };
}

/* ------------------------------------------------------------------ */
/* Aggregates / stats                                                  */
/* ------------------------------------------------------------------ */

export interface SubjectProgress {
  subject: Subject;
  totalLectures: number;
  doneLectures: number;
  plannedLectures: number;
  doneMinutes: number;
  chapters: Array<Chapter & { doneLectures: number }>;
  chaptersDone: number;
  chaptersTotal: number;
  teachers: string[];
}

export interface Stats {
  totalLectures: number;
  doneLectures: number;
  totalSyllabusLectures: number;
  syllabusDonePct: number;
  doneMinutes: number;
  focusMinutesTotal: number;
  chaptersDone: number;
  chaptersTotal: number;
  backlogCount: number;
  backlogMinutes: number;
  streak: number;
  bestStreak: number;
  activeDays: number;
  consistency: number;
  finishDate: string | null;
  examDaysLeft: number;
  revisionsDone: number;
  heat: Record<string, number>;
  bySubject: SubjectProgress[];
  pacePlanned: Array<{ date: string; v: number }>;
  paceActual: Array<{ date: string; v: number }>;
  week: Array<{ date: string; planned: number; done: number; focus: number }>;
}

export async function getStats(userId: number): Promise<Stats> {
  const today = todayStr();
  const [profile, subs, chps, tchs, items, revs, sessions] = await Promise.all([
    getProfile(userId),
    db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.orderIndex)),
    db.select().from(chapters).where(eq(chapters.userId, userId)).orderBy(asc(chapters.orderIndex)),
    db.select().from(teachers).where(eq(teachers.userId, userId)),
    db.select().from(planItems).where(eq(planItems.userId, userId)),
    db.select().from(revisions).where(eq(revisions.userId, userId)),
    db.select().from(focusSessions).where(eq(focusSessions.userId, userId)),
  ]);

  const doneLectureItems = items.filter((i) => i.status === "done" && i.kind === "lecture");
  const doneByChapter = new Map<number, number>();
  for (const i of doneLectureItems) {
    if (i.chapterId != null) doneByChapter.set(i.chapterId, (doneByChapter.get(i.chapterId) ?? 0) + 1);
  }

  const activeChapters = chps.filter((c) => c.active);
  const totalSyllabusLectures = activeChapters.reduce((a, c) => a + c.totalLectures, 0);
  const syllabusDoneLectures = activeChapters.reduce(
    (a, c) => a + Math.min(c.totalLectures, doneByChapter.get(c.id) ?? 0),
    0
  );
  const chaptersDone = activeChapters.filter(
    (c) => c.totalLectures > 0 && (doneByChapter.get(c.id) ?? 0) >= c.totalLectures
  ).length;

  const bySubject: SubjectProgress[] = subs.map((s) => {
    const sChaps = chps.filter((c) => c.subjectId === s.id && c.active);
    const archived = chps.filter((c) => c.subjectId === s.id && !c.active && (doneByChapter.get(c.id) ?? 0) > 0);
    const all = [...sChaps, ...archived];
    const planned = items.filter((i) => i.subjectId === s.id && i.kind === "lecture");
    const doneItems = planned.filter((i) => i.status === "done");
    const sDoneByChapter = all.map((c) => ({ ...c, doneLectures: doneByChapter.get(c.id) ?? 0 }));
    return {
      subject: s,
      totalLectures: all.reduce((a, c) => a + c.totalLectures, 0),
      doneLectures: all.reduce((a, c) => a + Math.min(c.totalLectures, doneByChapter.get(c.id) ?? 0), 0),
      plannedLectures: planned.length,
      doneMinutes: doneItems.reduce((a, i) => a + i.minutes, 0),
      chapters: sDoneByChapter,
      chaptersDone: sChaps.filter((c) => c.totalLectures > 0 && (doneByChapter.get(c.id) ?? 0) >= c.totalLectures).length,
      chaptersTotal: sChaps.length,
      teachers: tchs.filter((t) => t.subjectId === s.id).map((t) => t.name),
    };
  });

  // Activity (for heatmap + streak): done items by doneAt date + focus sessions.
  const heat: Record<string, number> = {};
  for (const i of items) {
    if (i.status === "done" && i.doneAt) {
      const d = localDateOf(i.doneAt);
      heat[d] = (heat[d] ?? 0) + i.minutes;
    }
  }
  for (const fs of sessions) heat[fs.date] = (heat[fs.date] ?? 0) + fs.minutes;

  // Streaks
  const activeDateSet = new Set(Object.keys(heat).filter((d) => heat[d] > 0));
  let cursor = activeDateSet.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (activeDateSet.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  let bestStreak = 0;
  {
    const sorted = [...activeDateSet].sort();
    let run = 0;
    let prev = "";
    for (const d of sorted) {
      run = prev && diffDays(prev, d) === 1 ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      prev = d;
    }
  }

  // Backlog: pending lectures dated before today
  const past = items.filter((i) => i.date < today && i.status === "pending");
  const backlogLectures = past.filter((i) => i.kind === "lecture");

  // Pace series (lectures only)
  const lectureItems = items.filter((i) => i.kind === "lecture");
  const plannedByDate = new Map<string, number>();
  const actualByDate = new Map<string, number>();
  for (const i of lectureItems) plannedByDate.set(i.date, (plannedByDate.get(i.date) ?? 0) + 1);
  for (const i of doneLectureItems) {
    const d = i.doneAt ? localDateOf(i.doneAt) : i.date;
    actualByDate.set(d, (actualByDate.get(d) ?? 0) + 1);
  }
  const pacePlanned: Stats["pacePlanned"] = [];
  const paceActual: Stats["paceActual"] = [];
  const allDates = [
    ...new Set([...plannedByDate.keys(), ...actualByDate.keys()]),
  ].sort();
  let cumP = 0;
  let cumA = 0;
  for (const d of allDates) {
    cumP += plannedByDate.get(d) ?? 0;
    cumA += actualByDate.get(d) ?? 0;
    pacePlanned.push({ date: d, v: cumP });
    paceActual.push({ date: d, v: cumA });
  }

  // Week bars: last 7 days planned vs done minutes + focus
  const week: Stats["week"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    const planned = items.filter((x) => x.date === d).reduce((a, x) => a + x.minutes, 0);
    const done = items
      .filter((x) => x.status === "done" && x.doneAt && localDateOf(x.doneAt) === d)
      .reduce((a, x) => a + x.minutes, 0);
    const focus = sessions.filter((x) => x.date === d).reduce((a, x) => a + x.minutes, 0);
    week.push({ date: d, planned, done, focus });
  }

  const firstActive = [...activeDateSet].sort()[0] ?? today;
  const journeyDays = Math.max(1, diffDays(firstActive, today) + 1);
  const consistency = Math.round((activeDateSet.size / journeyDays) * 100);

  const pendingItems = items.filter((i) => i.status === "pending");
  const finishDate = pendingItems.length ? pendingItems[pendingItems.length - 1].date : null;

  return {
    totalLectures: lectureItems.length,
    doneLectures: doneLectureItems.length,
    totalSyllabusLectures,
    syllabusDonePct: totalSyllabusLectures ? Math.round((syllabusDoneLectures / totalSyllabusLectures) * 100) : 0,
    doneMinutes: doneLectureItems.reduce((a, i) => a + i.minutes, 0),
    focusMinutesTotal: sessions.reduce((a, x) => a + x.minutes, 0),
    chaptersDone,
    chaptersTotal: activeChapters.length,
    backlogCount: backlogLectures.length,
    backlogMinutes: backlogLectures.reduce((a, i) => a + i.minutes, 0),
    streak,
    bestStreak,
    activeDays: activeDateSet.size,
    consistency,
    finishDate,
    examDaysLeft: profile.examDate ? diffDays(today, profile.examDate) : 0,
    revisionsDone: revs.reduce((a, r) => a + r.rounds, 0),
    heat,
    bySubject,
    pacePlanned,
    paceActual,
    week,
  };
}

function localDateOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ------------------------------------------------------------------ */
/* Misc queries                                                        */
/* ------------------------------------------------------------------ */

export async function getTodayBundle(userId: number, date: string) {
  const [profile, items, subs, note, sessions] = await Promise.all([
    getProfile(userId),
    db.select().from(planItems).where(and(eq(planItems.userId, userId), eq(planItems.date, date))).orderBy(asc(planItems.id)),
    db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.orderIndex)),
    db.select().from(dayNotes).where(and(eq(dayNotes.userId, userId), eq(dayNotes.date, date))).limit(1),
    db.select().from(focusSessions).where(and(eq(focusSessions.userId, userId), eq(focusSessions.date, date))),
  ]);
  const subjMap = new Map(subs.map((s) => [s.id, s]));
  return {
    profile,
    items: items.map((i) => ({ ...i, subject: subjMap.get(i.subjectId) })),
    subjects: subs,
    note: note[0]?.text ?? "",
    focusMinutes: sessions.reduce((a, s) => a + s.minutes, 0),
  };
}

export async function getBacklogs(userId: number) {
  const today = todayStr();
  const [subs, items] = await Promise.all([
    db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.orderIndex)),
    db
      .select()
      .from(planItems)
      .where(and(eq(planItems.userId, userId), lt(planItems.date, today), eq(planItems.status, "pending")))
      .orderBy(asc(planItems.date)),
  ]);
  const subjMap = new Map(subs.map((s) => [s.id, s]));
  return items.map((i) => ({ ...i, subject: subjMap.get(i.subjectId) }));
}

export async function getRevisionData(userId: number) {
  const [chps, revs, items] = await Promise.all([
    db.select().from(chapters).where(eq(chapters.userId, userId)).orderBy(asc(chapters.orderIndex)),
    db.select().from(revisions).where(eq(revisions.userId, userId)),
    db
      .select({ chapterId: planItems.chapterId, n: sql<number>`count(*)::int` })
      .from(planItems)
      .where(and(eq(planItems.userId, userId), eq(planItems.status, "done"), eq(planItems.kind, "lecture")))
      .groupBy(planItems.chapterId),
  ]);
  const doneMap = new Map(items.map((r) => [r.chapterId, r.n]));
  const revMap = new Map(revs.map((r) => [r.chapterId, r]));
  const completed = chps.filter(
    (c) => c.active && c.totalLectures > 0 && (doneMap.get(c.id) ?? 0) >= c.totalLectures
  );
  const inProgress = chps.filter(
    (c) => c.active && (doneMap.get(c.id) ?? 0) > 0 && (doneMap.get(c.id) ?? 0) < c.totalLectures
  );
  return { completed, inProgress, revMap, doneMap };
}

export async function getTrackerData(userId: number) {
  const stats = await getStats(userId);
  const today = todayStr();
  const items = await db
    .select()
    .from(planItems)
    .where(eq(planItems.userId, userId))
    .orderBy(asc(planItems.date), asc(planItems.id));
  const itemsByChapter = new Map<number, PlanItem[]>();
  for (const i of items) {
    if (i.chapterId == null || i.kind !== "lecture") continue;
    (itemsByChapter.get(i.chapterId) ?? itemsByChapter.set(i.chapterId, []).get(i.chapterId)!).push(i);
  }
  return { stats, itemsByChapter, today };
}

export function humanMinutes(min: number): string {
  return fmtMinutes(min);
}
