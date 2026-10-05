import { addDays, dayOfWeek, diffDays } from "./utils";

/* ------------------------------------------------------------------ */
/* Deadline planner: "I want to finish the syllabus by <date>" →       */
/* how many lectures a day, and how many study hours that really means. */
/* Pure & shared (runs in the browser while the student edits).         */
/* ------------------------------------------------------------------ */

export interface DeadlineSubject {
  key: string;
  lectureLength: number;
  chapters: Array<{ active: boolean; name: string; lectures: number; lectureMinutes: number[]; done?: number }>;
}

export interface DeadlineInput {
  today: string;
  startDate: string;
  deadline: string;
  revisionEnabled: boolean;
  revisionDay: number;
  speed: number;
  selfStudyRatio: number;
  subjects: DeadlineSubject[];
}

export interface DeadlineResult {
  ok: boolean;
  reason?: string;
  studyDays: number; // actual calendar days available before the deadline
  studyDaysPerWeek: number;
  remainingLectures: number;
  lecturesPerDay: number;
  lectureMinutesPerDay: number; // watching time (after playback speed)
  totalMinutesPerDay: number; // lectures + self-study, rounded to 30
  routine: Array<{ dayOfWeek: number; subjectKey: string; lectures: number }>;
  capped: boolean; // some subject needed more than 12 lectures a day
}

export function studyWeekdays(revisionEnabled: boolean, revisionDay: number): number[] {
  const all = [1, 2, 3, 4, 5, 6, 0];
  return revisionEnabled ? all.filter((d) => d !== revisionDay) : all.filter((d) => d !== 0);
}

export function designFromDeadline(inp: DeadlineInput): DeadlineResult {
  const empty: DeadlineResult = {
    ok: false,
    studyDays: 0,
    studyDaysPerWeek: 0,
    remainingLectures: 0,
    lecturesPerDay: 0,
    lectureMinutesPerDay: 0,
    totalMinutesPerDay: 0,
    routine: [],
    capped: false,
  };
  const start = inp.startDate > inp.today ? inp.startDate : inp.today;
  if (!inp.deadline) return { ...empty, reason: "Pick a date to finish the syllabus." };
  if (diffDays(start, inp.deadline) < 1) return { ...empty, reason: "The syllabus deadline must be after today." };

  const dows = studyWeekdays(inp.revisionEnabled, inp.revisionDay);
  const k = dows.length;
  let n = 0;
  for (let d = start, i = 0; d <= inp.deadline && i < 900; d = addDays(d, 1), i++) {
    if (dows.includes(dayOfWeek(d))) n++;
  }
  if (n < 1) return { ...empty, reason: "No study days before the deadline." };

  // remaining work per subject
  const speed = inp.speed > 0 ? inp.speed : 1;
  const work = inp.subjects.map((s) => {
    let lectures = 0;
    let minutes = 0;
    for (const c of s.chapters) {
      if (!c.active || !c.name.trim()) continue;
      for (let i = (c.done ?? 0) + 1; i <= c.lectures; i++) {
        lectures++;
        minutes += (c.lectureMinutes[i - 1] > 0 ? c.lectureMinutes[i - 1] : s.lectureLength) / speed;
      }
    }
    return { key: s.key, lectures, minutes };
  });
  const remainingLectures = work.reduce((a, w) => a + w.lectures, 0);
  if (remainingLectures === 0) return { ...empty, ok: true, studyDays: n, studyDaysPerWeek: k, reason: "Nothing left to schedule." };

  // lectures per week of each subject, rounded UP so the deadline is actually met
  const load: Record<number, number> = Object.fromEntries(dows.map((d) => [d, 0]));
  const cell = new Map<string, number>(); // `${dow}|${key}` -> lectures
  let capped = false;
  let weeklyMinutes = 0;
  const ordered = [...work].sort((a, b) => b.lectures - a.lectures);
  for (const w of ordered) {
    if (!w.lectures) continue;
    const weekly = Math.max(1, Math.ceil((w.lectures * k) / n - 1e-9));
    const avg = w.minutes / w.lectures;
    weeklyMinutes += weekly * avg;
    const base = Math.floor(weekly / k);
    let extra = weekly - base * k;
    for (const d of dows) {
      cell.set(`${d}|${w.key}`, base);
      load[d] += base * avg;
    }
    // hand the leftover lectures to the currently lightest days
    while (extra-- > 0) {
      const d = [...dows].sort((a, b) => load[a] - load[b])[0];
      cell.set(`${d}|${w.key}`, (cell.get(`${d}|${w.key}`) ?? 0) + 1);
      load[d] += avg;
    }
  }

  const routine: DeadlineResult["routine"] = [];
  for (const d of dows) {
    for (const w of work) {
      let c = cell.get(`${d}|${w.key}`) ?? 0;
      if (c > 12) {
        c = 12;
        capped = true;
      }
      if (c > 0) routine.push({ dayOfWeek: d, subjectKey: w.key, lectures: c });
    }
  }

  const lectureMinutesPerDay = Math.round(weeklyMinutes / k);
  const total = lectureMinutesPerDay * (1 + Math.max(0, inp.selfStudyRatio));
  const totalMinutesPerDay = Math.min(900, Math.max(120, Math.round(total / 30) * 30));
  return {
    ok: true,
    studyDays: n,
    studyDaysPerWeek: k,
    remainingLectures,
    lecturesPerDay: Math.round((remainingLectures / n) * 10) / 10,
    lectureMinutesPerDay,
    totalMinutesPerDay,
    routine,
    capped,
  };
}
