"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Loader2,
  Rocket,
  User,
  BookCopy,
  CalendarRange,
  SlidersHorizontal,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import {
  type Draft,
  draftFromDefaults,
  ProfileEditor,
  SubjectsEditor,
  ChaptersEditor,
  RoutineEditor,
  EngineEditor,
  designDraft,
  fitMinutes,
  defaultDeadline,
} from "./config-editors";
import { generatePlan, summarizeItems } from "@/lib/planner";
import { fmtDate, fmtMinutes, diffDays, todayStr } from "@/lib/utils";

export interface ConfigJsonSubject {
  id: number;
  key: string;
  name: string;
  color: string;
  icon: string;
  lectureLength: number;
  teachers: string[];
  chapters: Array<{
    id: number;
    name: string;
    cls: number;
    lectures: number;
    active: boolean;
    doneLectures: number;
    lectureMinutes: number[];
    teacher: string;
  }>;
}
export interface ConfigJson {
  isEmpty: boolean;
  profile: {
    name: string;
    motto: string;
    examDate: string;
    startDate: string;
    syllabusDeadline: string;
    selfStudyRatio: string;
    dailyTargetMinutes: number;
    speed: string;
    style: string;
    revisionEnabled: boolean;
    revisionDay: number;
    revisionMinutes: number;
  };
  subjects: ConfigJsonSubject[];
  routine: Array<{ dayOfWeek: number; subjectKey: string; lectures: number }>;
}

export function draftFromConfig(c: ConfigJson): Draft {
  if (c.isEmpty) return draftFromDefaults();
  return {
    profile: {
      name: c.profile.name,
      motto: c.profile.motto,
      examDate: c.profile.examDate,
      startDate: c.profile.startDate,
      syllabusDeadline: c.profile.syllabusDeadline || defaultDeadline(c.profile.examDate, c.profile.startDate),
      selfStudyRatio: Number(c.profile.selfStudyRatio) || 1,
      dailyTargetMinutes: c.profile.dailyTargetMinutes,
      speed: Number(c.profile.speed) || 1.25,
      style: c.profile.style,
      revisionEnabled: c.profile.revisionEnabled,
      revisionDay: c.profile.revisionDay,
      revisionMinutes: c.profile.revisionMinutes,
    },
    subjects: c.subjects.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      color: s.color,
      icon: s.icon,
      lectureLength: s.lectureLength,
      teachers: [...s.teachers],
      chapters: s.chapters.map((ch) => ({
        id: ch.id,
        key: String(ch.id),
        name: ch.name,
        cls: ch.cls,
        lectures: ch.lectures,
        active: ch.active,
        lectureMinutes: fitMinutes(ch.lectureMinutes ?? [], ch.lectures, s.lectureLength),
        teacher: ch.teacher ?? "",
        done: ch.doneLectures,
      })),
    })),
    routine: c.routine.map((r) => ({ ...r })),
  };
}

export function toPayload(draft: Draft, setupCompleted: boolean) {
  return {
    profile: {
      name: draft.profile.name.trim(),
      motto: draft.profile.motto.trim(),
      examDate: draft.profile.examDate,
      startDate: draft.profile.startDate,
      syllabusDeadline: draft.profile.syllabusDeadline,
      selfStudyRatio: draft.profile.selfStudyRatio,
      dailyTargetMinutes: draft.profile.dailyTargetMinutes,
      speed: draft.profile.speed,
      style: draft.profile.style,
      revisionEnabled: draft.profile.revisionEnabled,
      revisionDay: draft.profile.revisionDay,
      revisionMinutes: draft.profile.revisionMinutes,
    },
    subjects: draft.subjects.map((s) => ({
      id: s.id,
      key: s.key,
      name: s.name.trim() || "Subject",
      color: s.color,
      icon: s.icon,
      lectureLength: s.lectureLength,
      // teachers typed straight into a chapter are added to the subject's teacher list too
      teachers: Array.from(
        new Set([...s.teachers, ...s.chapters.map((c) => c.teacher.trim())].map((t) => t.trim()).filter(Boolean))
      ),
      chapters: s.chapters
        .filter((c) => c.name.trim())
        .map((c) => ({
          id: c.id,
          name: c.name.trim(),
          cls: c.cls,
          lectures: c.lectures,
          active: c.active,
          lectureMinutes: fitMinutes(c.lectureMinutes, c.lectures, s.lectureLength).map((m) =>
            m >= 10 ? Math.min(600, m) : s.lectureLength
          ),
          teacher: c.teacher.trim(),
        })),
    })),
    routine: draft.routine.filter((r) => draft.subjects.some((s) => s.key === r.subjectKey)),
    setupCompleted,
  };
}

/** Live preview of the plan for the review step + wizard summary. */
export function usePlanPreview(draft: Draft, doneByChapter: Record<number, number>) {
  return useMemo(() => {
    const keyToNum = new Map(draft.subjects.map((s, i) => [s.key, i + 1]));
    const subjects = draft.subjects.map((s, i) => ({
      id: i + 1,
      lectureLength: s.lectureLength,
      chapters: s.chapters
        .filter((c) => c.active && c.name.trim())
        .map((c) => ({
          id: c.id ?? -(keyToNum.get(s.key)! * 1000 + Math.abs(hashKey(c.key))),
          totalLectures: c.lectures,
          lectureMinutes: c.lectureMinutes,
        })),
    }));
    const routine = draft.routine
      .filter((r) => keyToNum.has(r.subjectKey))
      .map((r) => ({ dayOfWeek: r.dayOfWeek, subjectId: keyToNum.get(r.subjectKey)!, lectures: r.lectures }));
    const items = generatePlan({
      today: todayStr(),
      startDate: draft.profile.startDate,
      speed: draft.profile.speed || 1,
      style: draft.profile.style,
      revisionEnabled: draft.profile.revisionEnabled,
      revisionDay: draft.profile.revisionDay,
      revisionMinutes: draft.profile.revisionMinutes,
      subjects,
      routine,
      doneByChapter,
      revisedChapterIds: new Set(),
    });
    return { items, summary: summarizeItems(items) };
  }, [draft, doneByChapter]);
}

function hashKey(k: string) {
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
  return h % 997;
}

const STEPS = [
  { id: "profile", label: "You", icon: User, title: "First — who is going to be a doctor?", sub: "Your name and your exam date. Everything else bends around these." },
  { id: "subjects", label: "Subjects", icon: BookCopy, title: "Your subjects & your teachers", sub: "Four NEET subjects are preloaded. Add the teachers whose lectures you actually watch — you will pick one for every chapter next." },
  { id: "chapters", label: "Chapters", icon: ClipboardCheck, title: "Chapters & lecture counts", sub: "The full syllabus is preloaded. For every chapter set the lecture count, the length of each lecture and the teacher you follow — I can't know your batch, you can." },
  { id: "routine", label: "Routine", icon: CalendarRange, title: "Your weekly routine", sub: "Designed backwards from your syllabus deadline. Which subjects on which days, and how many lectures — empty days are rest days." },
  { id: "engine", label: "Engine", icon: SlidersHorizontal, title: "Tune the engine", sub: "Playback speed, study style and your weekly revision ritual." },
  { id: "review", label: "Ignite", icon: Rocket, title: "Review & ignite", sub: "Here is the plan the engine built for you. If it looks right, light it up." },
];

export default function SetupWizard({ config }: { config: ConfigJson }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => draftFromConfig(config));
  const [saving, startSave] = useTransition();
  const [error, setError] = useState("");
  const autoDesigned = useRef(false);

  const doneByChapter = useMemo(() => {
    const m: Record<number, number> = {};
    for (const s of config.subjects) for (const c of s.chapters) if (c.doneLectures) m[c.id] = c.doneLectures;
    return m;
  }, [config]);

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => fn(d));
  const preview = usePlanPreview(draft, doneByChapter);

  const totalLectures = draft.subjects.reduce(
    (a, s) => a + s.chapters.filter((c) => c.active && c.name.trim()).reduce((x, c) => x + c.lectures, 0),
    0
  );
  const doneLectures = Object.values(doneByChapter).reduce((a, b) => a + b, 0);
  const finishDelta = preview.items.length ? diffDays(preview.summary.finishDate, draft.profile.examDate) : null;
  const deadlineDelta =
    preview.items.length && draft.profile.syllabusDeadline
      ? diffDays(preview.summary.finishDate, draft.profile.syllabusDeadline)
      : null;
  const canNext = step === 0 ? draft.profile.name.trim().length > 0 && !!draft.profile.examDate : true;

  const save = () => {
    setError("");
    startSave(async () => {
      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(draft, true)),
        });
        const json = await res.json();
        if (!json.ok) throw new Error();
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Couldn't build your plan. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen relative">
      <div className="orb w-[34rem] h-[34rem] -top-32 -right-40 bg-accent/20" style={{ animation: "float-slow 18s ease-in-out infinite" }} />
      <div className="orb w-[28rem] h-[28rem] bottom-[-6rem] -left-32 bg-[#6C64E0]/15" style={{ animation: "float-slower 22s ease-in-out infinite" }} />

      <div className="mx-auto max-w-4xl px-4 py-10 md:py-14 relative">
        {/* header */}
        <div className="text-center mb-10 anim-rise">
          <div className="inline-flex items-center gap-2 chip mb-5">
            <Sparkles size={13} className="text-accent" />
            {config.isEmpty ? "Welcome aboard — one-time setup" : "Re-configure your engine"}
          </div>
          <h1 className="font-display text-[2.1rem] md:text-[3rem] leading-[1.08] tracking-tight">
            {STEPS[step].title.split(" ").slice(0, -2).join(" ")}{" "}
            <span className="serif-i grad-text">{STEPS[step].title.split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink-2 max-w-xl mx-auto">{STEPS[step].sub}</p>
        </div>

        {/* step rail */}
        <div className="flex items-center justify-center gap-1.5 md:gap-2 mb-10 flex-wrap">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-all duration-300 ${
                i === step
                  ? "bg-ink text-bg dark:bg-accent dark:text-white shadow"
                  : i < step
                    ? "bg-[var(--good-soft)] text-[var(--good)]"
                    : "bg-surface border border-line text-ink-3"
              }`}
            >
              {i < step ? <Check size={12} strokeWidth={3} /> : <s.icon size={12} />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <div key={step} className="card p-6 md:p-8 anim-rise" style={{ animationDuration: "0.5s" }}>
          {step === 0 && <ProfileEditor draft={draft} update={update} />}
          {step === 1 && <SubjectsEditor draft={draft} update={update} />}
          {step === 2 && <ChaptersEditor draft={draft} update={update} />}
          {step === 3 && <RoutineEditor draft={draft} update={update} />}
          {step === 4 && <EngineEditor draft={draft} update={update} />}
          {step === 5 && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { l: "Lectures to go", v: Math.max(0, totalLectures - doneLectures), s: `${draft.subjects.reduce((a, s) => a + s.chapters.filter((c) => c.active && c.name.trim()).length, 0)} active chapters` },
                  { l: "Est. finish", v: preview.items.length ? fmtDate(preview.summary.finishDate) : "—", s:
                      deadlineDelta !== null
                        ? deadlineDelta >= 0
                          ? `${deadlineDelta} days before your syllabus target`
                          : `${Math.abs(deadlineDelta)} days after your target — redesign on the Routine step`
                        : finishDelta === null
                          ? "all done"
                          : finishDelta >= 0
                            ? `${finishDelta} days before NEET`
                            : `${Math.abs(finishDelta)} days past NEET — add load`,
                  },
                  { l: "Study load", v: preview.summary.avgMinutesPerActiveDay ? fmtMinutes(preview.summary.avgMinutesPerActiveDay) : "—", s: "per active day, on average" },
                ].map((c) => (
                  <div key={c.l} className="rounded-2xl border border-line bg-surface-2 p-4">
                    <div className="eyebrow !text-[10px] mb-2">{c.l}</div>
                    <div className="font-display text-[1.35rem] leading-tight">{c.v}</div>
                    <div className="text-[11px] text-ink-2 mt-1">{c.s}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-line p-5">
                <div className="eyebrow !text-[10px] mb-3">What you just told the engine</div>
                <ul className="text-[13px] text-ink-2 space-y-1.5">
                  <li>· {draft.subjects.length} subjects — {draft.subjects.map((s) => s.name).join(", ")}</li>
                  <li>· Teachers: {draft.subjects.flatMap((s) => s.teachers).length ? draft.subjects.flatMap((s) => s.teachers).join(", ") : "not added yet"}</li>
                  <li>· Lectures at {draft.profile.speed}× speed, {draft.profile.style} style, {draft.profile.revisionEnabled ? "weekly revision on" : "no revision day"}</li>
                  <li>· Syllabus target {draft.profile.syllabusDeadline ? fmtDate(draft.profile.syllabusDeadline) : "not set"} — daily study {fmtMinutes(draft.profile.dailyTargetMinutes)}, NEET on {fmtDate(draft.profile.examDate)}</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-ink text-bg dark:bg-surface-2 dark:text-ink p-5 flex items-center gap-4">
                <Flame size={22} className="text-accent flex-none streak-pulse" />
                <p className="font-display serif-i text-[15px] leading-relaxed">
                  “{draft.profile.name.split(" ")[0]}, the plan only works if you show up daily. Tick honestly. The streak never lies.”
                </p>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between mt-7">
          <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || saving}>
            <ArrowLeft size={15} /> Back
          </button>
          <div className="mono text-[11.5px] text-ink-3">
            step {step + 1} / {STEPS.length}
          </div>
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!canNext) return;
                // first-time setup: design the routine + daily hours from the deadline once chapters are final
                if (step === 2 && config.isEmpty && !autoDesigned.current) {
                  autoDesigned.current = true;
                  setDraft((d) => designDraft(d).draft);
                }
                setStep((s) => s + 1);
              }}
              disabled={!canNext}
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button className="btn btn-accent !px-7" onClick={save} disabled={saving}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
              {saving ? "Building your plan…" : "Ignite my tracker"}
            </button>
          )}
        </div>
        {step === 0 && !canNext && (
          <p className="text-center text-[12px] text-ink-3 mt-3">Tell me your name and exam date to continue.</p>
        )}
        {error && <p className="text-center text-[13px] text-[var(--bad)] mt-4">{error}</p>}
        {step === 3 && draft.routine.length === 0 && (
          <p className="text-center text-[12.5px] text-[var(--warn)] mt-3">
            No subjects assigned to any day — the engine can't schedule lectures like this.
          </p>
        )}
      </div>
    </div>
  );
}
