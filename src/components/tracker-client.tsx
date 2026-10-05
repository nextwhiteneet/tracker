"use client";

import { memo, useCallback, useMemo, useRef, useState, useTransition } from "react";
import { Check, Search, GraduationCap } from "lucide-react";
import { SubjectGlyph, ProgressBar } from "./ui";
import { burst } from "./tick";

interface Pill {
  id: number;
  index: number;
  done: boolean;
  today: boolean;
  backlog: boolean;
}
type CheckKey = "dpp" | "notes" | "ncert" | "pyq";
const CHECKS: Array<[CheckKey, string]> = [
  ["dpp", "DPP"],
  ["notes", "Notes"],
  ["ncert", "NCERT"],
  ["pyq", "PYQs"],
];
interface TrackerChapter {
  id: number;
  name: string;
  cls: number;
  total: number;
  done: number;
  archived: boolean;
  pills: Pill[];
  teacher: string;
  checks: Record<CheckKey, boolean>;
}
export interface TrackerSubject {
  id: number;
  name: string;
  color: string;
  icon: string;
  teachers: string[];
  doneLectures: number;
  totalLectures: number;
  chapters: TrackerChapter[];
}

function chapterDoneCount(ch: TrackerChapter, overrides: Record<number, boolean>) {
  let d = ch.done;
  for (const p of ch.pills) {
    if (p.id in overrides && overrides[p.id] !== p.done) d += overrides[p.id] ? 1 : -1;
  }
  return Math.min(ch.total, Math.max(0, d));
}

/** Only the chapters whose own pills changed re-render. */
const ChapterRow = memo(
  function ChapterRow({
    c,
    ci,
    overrides,
    onToggle,
  }: {
    c: TrackerChapter;
    ci: number;
    overrides: Record<number, boolean>;
    onToggle: (p: Pill) => void;
  }) {
    const d = chapterDoneCount(c, overrides);
    const sealed = d >= c.total && c.total > 0;
    const [checks, setChecks] = useState(c.checks);
    const flip = async (field: CheckKey) => {
      const next = !checks[field];
      setChecks((x) => ({ ...x, [field]: next }));
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId: c.id, field, value: next }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error();
      } catch {
        setChecks((x) => ({ ...x, [field]: !next }));
      }
    };
    return (
      <div
        className="cv-auto anim-rise flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-line bg-surface px-4 py-3.5 hover:border-line-strong transition-colors"
        style={{ animationDelay: `${Math.min(ci, 8) * 35}ms`, animationDuration: "0.5s" }}
      >
        <div className="flex-1 min-w-44">
          <div className="flex items-center gap-2">
            {sealed && (
              <span className="grid place-items-center w-4 h-4 rounded-full bg-[var(--good)] text-white flex-none">
                <Check size={11} strokeWidth={3.5} />
              </span>
            )}
            <span className={`text-[13.5px] font-medium ${c.archived ? "text-ink-3" : ""}`}>{c.name}</span>
          </div>
          <div className="text-[10.5px] text-ink-3 mt-0.5 flex items-center gap-2">
            <span className="mono uppercase">class {c.cls}</span>
            {c.archived && <span className="text-[var(--warn)]">archived</span>}
            {c.teacher && (
              <span className="inline-flex items-center gap-1">
                <GraduationCap size={11} /> {c.teacher}
              </span>
            )}
            <span className={sealed ? "text-[var(--good)] font-medium" : ""}>
              {d}/{c.total} lectures
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {c.pills.map((p) => {
            const eff = p.id in overrides ? overrides[p.id] : p.done;
            return p.id < 0 ? (
              <span key={`x-${p.index}`} className="pill opacity-40 !cursor-not-allowed" title="Not scheduled yet — re-plan to schedule">
                {p.index}
              </span>
            ) : (
              <button
                key={p.id}
                onClick={() => onToggle(p)}
                className="pill"
                data-done={eff ? "true" : undefined}
                data-today={p.today && !eff ? "true" : undefined}
                data-backlog={p.backlog && !eff ? "true" : undefined}
                title={eff ? `Lecture ${p.index} · done (tap to undo)` : `Lecture ${p.index} · tap when done`}
              >
                {eff ? <Check size={12} strokeWidth={3.2} /> : p.index}
              </button>
            );
          })}
        </div>
        {!c.archived && (
          <div className="w-full flex flex-wrap items-center gap-1.5">
            <span className="mono text-[10px] uppercase tracking-wider text-ink-3 mr-1">practice</span>
            {CHECKS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={checks[key]}
                onClick={() => flip(key)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  checks[key]
                    ? "border-[var(--good)]/40 bg-[var(--good-soft)] text-[var(--good)]"
                    : "border-line text-ink-2 hover:border-line-strong"
                }`}
              >
                {checks[key] ? "✓ " : ""}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
  (a, b) => {
    if (a.c !== b.c || a.ci !== b.ci || a.onToggle !== b.onToggle) return false;
    for (const p of a.c.pills) {
      if (a.overrides[p.id] !== b.overrides[p.id]) return false;
    }
    return true;
  }
);

export function TrackerClient({ subjects }: { subjects: TrackerSubject[] }) {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<number | "all">("all");
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const overridesRef = useRef<Record<number, boolean>>({});
  const [, startTransition] = useTransition();

  const liveSubject = useMemo(() => {
    return subjects.map((s) => {
      let done = s.doneLectures;
      for (const c of s.chapters) {
        for (const p of c.pills) {
          if (p.id in overrides && overrides[p.id] !== p.done) done += overrides[p.id] ? 1 : -1;
        }
      }
      return { ...s, doneLectures: done };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, overrides]);

  const toggle = useCallback((pill: Pill) => {
    if (pill.id < 0) return;
    const next = !(overridesRef.current[pill.id] ?? pill.done);
    overridesRef.current = { ...overridesRef.current, [pill.id]: next };
    setOverrides(overridesRef.current);
    startTransition(async () => {
      try {
        const res = await fetch("/api/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pill.id, done: next }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error();
        if (next && json.chapterJustCompleted) burst();
      } catch {
        overridesRef.current = { ...overridesRef.current, [pill.id]: !next };
        setOverrides(overridesRef.current);
      }
    });
  }, []);

  const visible = liveSubject.filter((s) => activeId === "all" || s.id === activeId);

  return (
    <div className="space-y-8">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-2.5 sticky top-[6.7rem] lg:top-4 z-30">
        <div className="glass rounded-full p-1 flex gap-0.5 flex-wrap">
          <button
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${activeId === "all" ? "bg-ink text-bg dark:bg-accent dark:text-white" : "text-ink-2"}`}
            onClick={() => setActiveId("all")}
          >
            All
          </button>
          {liveSubject.map((s) => (
            <button
              key={s.id}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors flex items-center gap-1.5 ${activeId === s.id ? "bg-ink text-bg dark:bg-accent dark:text-white" : "text-ink-2"}`}
              onClick={() => setActiveId(s.id)}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a chapter…"
            className="input !rounded-full !pl-9 !py-2 text-[13px]"
          />
        </div>
      </div>

      {visible.map((s) => {
        const chapters = s.chapters.filter(
          (c) => !s.chapters.length || c.name.toLowerCase().includes(query.toLowerCase())
        );
        const pctg = s.totalLectures ? Math.round((s.doneLectures / s.totalLectures) * 100) : 0;
        return (
          <section key={s.id}>
            <header className="flex flex-wrap items-center gap-4 mb-4">
              <SubjectGlyph icon={s.icon} color={s.color} size={18} />
              <div className="flex-1 min-w-32">
                <h3 className="font-display text-[1.35rem] leading-none">{s.name}</h3>
                {s.teachers.length > 0 && (
                  <div className="text-[11.5px] text-ink-2 mt-1.5 flex items-center gap-1.5">
                    <GraduationCap size={12} /> {s.teachers.join(" · ")}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="mono text-[1.15rem] font-semibold leading-none">
                  {s.doneLectures}
                  <span className="text-ink-3 text-[13px]">/{s.totalLectures}</span>
                </div>
                <div className="text-[10.5px] text-ink-3 mt-1">{pctg}% complete</div>
              </div>
              <div className="w-full sm:w-44">
                <ProgressBar value={pctg} color={s.color} height={6} />
              </div>
            </header>

            <div className="space-y-2.5">
              {chapters.map((c, ci) => {
                return (
                  <ChapterRow
                    key={c.id}
                    c={c}
                    ci={ci}
                    overrides={overrides}
                    onToggle={toggle}
                  />
                );
              })}
              {!chapters.length && (
                <div className="text-[13px] text-ink-2 px-2 py-4">No chapters match “{query}”.</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
