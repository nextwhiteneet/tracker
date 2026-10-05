"use client";

import { useState } from "react";
import { X, Plus, Minus, Trash2, Eye, EyeOff, ChevronDown } from "lucide-react";
import { SUBJECT_COLORS, SUBJECT_ICONS, DEFAULT_SYLLABUS, defaultExamDate } from "@/lib/syllabus";
import { SubjectGlyph } from "./ui";
import { WEEKDAYS, todayStr } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Draft types (client-side editable config)                           */
/* ------------------------------------------------------------------ */

export interface ChapterDraft {
  id?: number;
  key: string;
  name: string;
  cls: number;
  lectures: number;
  active: boolean;
}
export interface SubjectDraft {
  id?: number;
  key: string;
  name: string;
  color: string;
  icon: string;
  lectureLength: number;
  teachers: string[];
  chapters: ChapterDraft[];
}
export interface RoutineDraft {
  dayOfWeek: number;
  subjectKey: string;
  lectures: number;
}
export interface ProfileDraft {
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
}
export interface Draft {
  profile: ProfileDraft;
  subjects: SubjectDraft[];
  routine: RoutineDraft[];
}

export const uid = () => Math.random().toString(36).slice(2, 9);

export function draftFromDefaults(name = ""): Draft {
  const today = todayStr();
  const subjects: SubjectDraft[] = DEFAULT_SYLLABUS.map((s) => ({
    key: s.key,
    name: s.name,
    color: s.color,
    icon: s.icon,
    lectureLength: s.lectureLength,
    teachers: [],
    chapters: s.chapters.map((c) => ({ key: uid(), name: c.name, cls: c.cls, lectures: c.lectures, active: true })),
  }));
  return {
    profile: {
      name,
      motto: "",
      examDate: defaultExamDate(),
      startDate: today,
      dailyTargetMinutes: 360,
      speed: 1.25,
      style: "steady",
      revisionEnabled: true,
      revisionDay: 0,
      revisionMinutes: 240,
    },
    subjects,
    routine: defaultRoutine(subjects.map((s) => s.key)),
  };
}

/** Sensible default: Mon–Sat rotation, PC / Bio alternating, Sunday revision. */
export function defaultRoutine(keys: string[]): RoutineDraft[] {
  const [p, c, b, z] = [keys[0], keys[1], keys[2] ?? keys[0], keys[3] ?? keys[1] ?? keys[0]];
  const out: RoutineDraft[] = [];
  for (let dow = 1; dow <= 6; dow++) {
    if (dow % 2 === 1) {
      out.push({ dayOfWeek: dow, subjectKey: p, lectures: 2 });
      out.push({ dayOfWeek: dow, subjectKey: c, lectures: 2 });
    } else {
      out.push({ dayOfWeek: dow, subjectKey: b, lectures: 2 });
      out.push({ dayOfWeek: dow, subjectKey: z, lectures: 2 });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Small controls                                                      */
/* ------------------------------------------------------------------ */

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  suffix = "",
  width = "w-[7.5rem]",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  width?: string;
}) {
  return (
    <div className={`inline-flex items-center rounded-full border border-line-strong ${width}`}>
      <button
        type="button"
        aria-label="decrease"
        className="grid place-items-center w-7 h-7 rounded-full hover:bg-surface-2 transition-colors disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus size={12} />
      </button>
      <span className="flex-1 text-center mono text-[12.5px] font-semibold">
        {value}
        {suffix && <span className="text-ink-3 text-[10.5px]"> {suffix}</span>}
      </span>
      <button
        type="button"
        aria-label="increase"
        className="grid place-items-center w-7 h-7 rounded-full hover:bg-surface-2 transition-colors disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-line p-1 bg-surface-2 gap-0.5 flex-wrap">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-300 ${
            value === o.value ? "bg-ink text-bg dark:bg-accent dark:text-white shadow-sm" : "text-ink-2 hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ChipEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {values.map((t) => (
        <span key={t} className="chip !bg-surface !text-ink group">
          {t}
          <button
            type="button"
            aria-label={`remove ${t}`}
            className="text-ink-3 hover:text-[var(--bad)] transition-colors"
            onClick={() => onChange(values.filter((x) => x !== t))}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="input !w-40 !py-1.5 !rounded-full text-[12.5px]"
        />
        <button type="button" onClick={add} className="btn btn-soft btn-xs !rounded-full">
          <Plus size={12} /> Add
        </button>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editors                                                             */
/* ------------------------------------------------------------------ */

export function ProfileEditor({
  draft,
  update,
}: {
  draft: Draft;
  update: (fn: (d: Draft) => Draft) => void;
}) {
  const p = draft.profile;
  const set = (patch: Partial<ProfileDraft>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <label className="block">
        <span className="eyebrow block mb-1.5">Your name</span>
        <input className="input" value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Aarav Sharma" />
      </label>
      <label className="block">
        <span className="eyebrow block mb-1.5">Personal motto (optional)</span>
        <input className="input" value={p.motto} onChange={(e) => set({ motto: e.target.value })} placeholder="e.g. AIIMS Delhi or nothing" />
      </label>
      <label className="block">
        <span className="eyebrow block mb-1.5">NEET exam date</span>
        <input type="date" className="input" value={p.examDate} onChange={(e) => set({ examDate: e.target.value })} />
      </label>
      <label className="block">
        <span className="eyebrow block mb-1.5">Preparation starts</span>
        <input type="date" className="input" value={p.startDate} onChange={(e) => set({ startDate: e.target.value })} />
      </label>
      <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-line px-4 py-3">
        <div>
          <div className="text-[13.5px] font-medium">Daily study target</div>
          <div className="text-[11.5px] text-ink-2">Shown against your actual minutes, everyday.</div>
        </div>
        <Stepper value={p.dailyTargetMinutes} onChange={(v) => set({ dailyTargetMinutes: v })} min={60} max={900} step={30} suffix="min" width="w-[9rem]" />
      </div>
    </div>
  );
}

export function SubjectsEditor({
  draft,
  update,
}: {
  draft: Draft;
  update: (fn: (d: Draft) => Draft) => void;
}) {
  const setSubject = (key: string, patch: Partial<SubjectDraft>) =>
    update((d) => ({ ...d, subjects: d.subjects.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  return (
    <div className="space-y-4">
      {draft.subjects.map((s) => (
        <div key={s.key} className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center gap-4">
            <SubjectGlyph icon={s.icon} color={s.color} size={16} />
            <input
              className="input !w-44 font-medium"
              value={s.name}
              onChange={(e) => setSubject(s.key, { name: e.target.value })}
            />
            <div className="flex items-center gap-1.5">
              {SUBJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`color ${c}`}
                  onClick={() => setSubject(s.key, { color: c })}
                  className="w-5 h-5 rounded-full transition-transform duration-300 hover:scale-110"
                  style={{
                    background: c,
                    outline: s.color === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {SUBJECT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSubject(s.key, { icon: i })}
                  className={`grid place-items-center w-7 h-7 rounded-lg transition-colors ${s.icon === i ? "bg-ink text-bg dark:bg-accent dark:text-white" : "text-ink-3 hover:text-ink hover:bg-surface-2"}`}
                >
                  <SubjectGlyph icon={i} color="currentColor" size={12} />
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-[11px] text-ink-2 text-right leading-tight">
                lecture
                <br />
                length
              </div>
              <Stepper value={s.lectureLength} onChange={(v) => setSubject(s.key, { lectureLength: v })} min={20} max={240} step={5} suffix="min" />
              {draft.subjects.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-xs !text-[var(--bad)]"
                  onClick={() =>
                    update((d) => ({
                      ...d,
                      subjects: d.subjects.filter((x) => x.key !== s.key),
                      routine: d.routine.filter((r) => r.subjectKey !== s.key),
                    }))
                  }
                >
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="eyebrow !text-[10px] mb-2">Teachers of {s.name} — add everyone whose lectures you watch</div>
            <ChipEditor values={s.teachers} onChange={(t) => setSubject(s.key, { teachers: t })} placeholder="Teacher's name" />
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() =>
          update((d) => ({
            ...d,
            subjects: [
              ...d.subjects,
              {
                key: `custom-${uid()}`,
                name: `Subject ${d.subjects.length + 1}`,
                color: SUBJECT_COLORS[d.subjects.length % SUBJECT_COLORS.length],
                icon: "book-open",
                lectureLength: 60,
                teachers: [],
                chapters: [],
              },
            ],
          }))
        }
      >
        <Plus size={14} /> Add another subject
      </button>
    </div>
  );
}

export function ChaptersEditor({
  draft,
  update,
}: {
  draft: Draft;
  update: (fn: (d: Draft) => Draft) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(draft.subjects.map((s, i) => [s.key, i === 0]))
  );

  return (
    <div className="space-y-4">
      <input
        className="input !rounded-full"
        placeholder="Search chapters…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <p className="text-[12px] text-ink-2 -mt-1">
        Preloaded with the full NEET syllabus. Set lecture counts to match <em>your</em> batch or video source — this is what drives your whole plan.
      </p>
      {draft.subjects.map((s) => {
        const visible = s.chapters.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
        const total = s.chapters.reduce((a, c) => a + (c.active ? c.lectures : 0), 0);
        const isOpen = q ? true : open[s.key];
        return (
          <div key={s.key} className="rounded-2xl border border-line bg-surface overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-2 transition-colors"
              onClick={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
            >
              <SubjectGlyph icon={s.icon} color={s.color} size={13} />
              <span className="font-semibold text-[14.5px]">{s.name}</span>
              <span className="chip mono !text-[11px]">{s.chapters.length} chapters · {total} lectures</span>
              <ChevronDown size={16} className={`ml-auto text-ink-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-line divide-y divide-line">
                {visible.map((c) => (
                  <div key={c.key} className="flex items-center gap-3 px-5 py-2.5 group">
                    <button
                      type="button"
                      title={c.active ? "Exclude from plan" : "Include in plan"}
                      onClick={() =>
                        update((d) => ({
                          ...d,
                          subjects: d.subjects.map((x) =>
                            x.key === s.key
                              ? { ...x, chapters: x.chapters.map((y) => (y.key === c.key ? { ...y, active: !y.active } : y)) }
                              : x
                          ),
                        }))
                      }
                      className={`transition-colors ${c.active ? "text-ink-2 hover:text-ink" : "text-ink-3"}`}
                    >
                      {c.active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <input
                      className={`input !border-0 !bg-transparent !p-0 !shadow-none flex-1 text-[13.5px] ${!c.active ? "line-through text-ink-3" : ""}`}
                      value={c.name}
                      onChange={(e) =>
                        update((d) => ({
                          ...d,
                          subjects: d.subjects.map((x) =>
                            x.key === s.key
                              ? { ...x, chapters: x.chapters.map((y) => (y.key === c.key ? { ...y, name: e.target.value } : y)) }
                              : x
                          ),
                        }))
                      }
                    />
                    <Segmented
                      options={[
                        { value: 11, label: "XI" },
                        { value: 12, label: "XII" },
                      ]}
                      value={c.cls}
                      onChange={(v) =>
                        update((d) => ({
                          ...d,
                          subjects: d.subjects.map((x) =>
                            x.key === s.key
                              ? { ...x, chapters: x.chapters.map((y) => (y.key === c.key ? { ...y, cls: v } : y)) }
                              : x
                          ),
                        }))
                      }
                    />
                    <Stepper
                      value={c.lectures}
                      onChange={(v) =>
                        update((d) => ({
                          ...d,
                          subjects: d.subjects.map((x) =>
                            x.key === s.key
                              ? { ...x, chapters: x.chapters.map((y) => (y.key === c.key ? { ...y, lectures: v } : y)) }
                              : x
                          ),
                        }))
                      }
                      min={1}
                      max={30}
                      width="w-[6.4rem]"
                    />
                    <button
                      type="button"
                      aria-label="delete chapter"
                      className="text-ink-3 hover:text-[var(--bad)] opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() =>
                        update((d) => ({
                          ...d,
                          subjects: d.subjects.map((x) =>
                            x.key === s.key ? { ...x, chapters: x.chapters.filter((y) => y.key !== c.key) } : x
                          ),
                        }))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() =>
                      update((d) => ({
                        ...d,
                        subjects: d.subjects.map((x) =>
                          x.key === s.key
                            ? { ...x, chapters: [...x.chapters, { key: uid(), name: "", cls: 11, lectures: 3, active: true }] }
                            : x
                        ),
                      }))
                    }
                  >
                    <Plus size={12} /> Add chapter to {s.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RoutineEditor({
  draft,
  update,
}: {
  draft: Draft;
  update: (fn: (d: Draft) => Draft) => void;
}) {
  const setDay = (dow: number, entries: RoutineDraft[]) =>
    update((d) => ({
      ...d,
      routine: [...d.routine.filter((r) => r.dayOfWeek !== dow), ...entries],
    }));

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-ink-2">
        Which subjects do you study on which day, and how many lectures? Leave a day empty for a weekly break — the plan engine respects it.
      </p>
      {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
        const entries = draft.routine
          .filter((r) => r.dayOfWeek === dow)
          .sort((a, b) => draft.subjects.findIndex((s) => s.key === a.subjectKey) - draft.subjects.findIndex((s) => s.key === b.subjectKey));
        const off = entries.length === 0;
        return (
          <div key={dow} className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${off ? "border-dashed border-line bg-transparent" : "border-line bg-surface"}`}>
            <div className={`w-24 font-semibold text-[13px] ${off ? "text-ink-3" : ""}`}>
              {WEEKDAYS[dow]}
              {off && <span className="block text-[10px] font-normal uppercase tracking-wider">rest day</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {entries.map((e, i) => {
                const subj = draft.subjects.find((s) => s.key === e.subjectKey);
                return (
                  <span key={e.subjectKey + i} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 pl-2 pr-1.5 py-1">
                    <SubjectGlyph icon={subj?.icon ?? "book-open"} color={subj?.color ?? "var(--accent)"} size={10} />
                    <span className="text-[12px] font-medium">{subj?.name ?? "?"}</span>
                    <Stepper
                      value={e.lectures}
                      onChange={(v) =>
                        setDay(dow, entries.map((x) => (x.subjectKey === e.subjectKey ? { ...x, lectures: v } : x)))
                      }
                      min={1}
                      max={8}
                      width="w-[5.2rem]"
                    />
                    <button
                      type="button"
                      aria-label="remove"
                      className="text-ink-3 hover:text-[var(--bad)]"
                      onClick={() => setDay(dow, entries.filter((x) => x.subjectKey !== e.subjectKey))}
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}
              {draft.subjects.some((s) => !entries.some((e) => e.subjectKey === s.key)) && (
                <select
                  className="input !w-auto !rounded-full !py-1.5 text-[12px]"
                  value=""
                  onChange={(ev) => {
                    const key = ev.target.value;
                    if (key) setDay(dow, [...entries, { dayOfWeek: dow, subjectKey: key, lectures: 2 }]);
                  }}
                >
                  <option value="">+ subject</option>
                  {draft.subjects
                    .filter((s) => !entries.some((e) => e.subjectKey === s.key))
                    .map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.name}
                      </option>
                    ))}
                </select>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EngineEditor({
  draft,
  update,
}: {
  draft: Draft;
  update: (fn: (d: Draft) => Draft) => void;
}) {
  const p = draft.profile;
  const set = (patch: Partial<ProfileDraft>) => update((d) => ({ ...d, profile: { ...d.profile, ...patch } }));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3.5">
        <div>
          <div className="text-[13.5px] font-medium">Playback speed</div>
          <div className="text-[11.5px] text-ink-2">Lecture minutes are divided by this.</div>
        </div>
        <Segmented
          options={[1, 1.25, 1.5, 1.75, 2].map((v) => ({ value: v, label: `${v}×` }))}
          value={p.speed}
          onChange={(v) => set({ speed: v })}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3.5">
        <div>
          <div className="text-[13.5px] font-medium">Study style</div>
          <div className="text-[11.5px] text-ink-2">
            {p.style === "intense"
              ? "Intense — weekend days get one extra lecture each."
              : p.style === "chill"
                ? "Chill — Fridays are one lecture lighter."
                : "Steady — an even load across the week. Recommended."}
          </div>
        </div>
        <Segmented
          options={[
            { value: "steady", label: "Steady" },
            { value: "intense", label: "Intense" },
            { value: "chill", label: "Chill" },
          ]}
          value={p.style}
          onChange={(v) => set({ style: v })}
        />
      </div>
      <div className="rounded-2xl border border-line px-4 py-3.5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[13.5px] font-medium">Weekly revision day</div>
            <div className="text-[11.5px] text-ink-2">One day a week reserved for revising finished chapters — no new lectures.</div>
          </div>
          <Segmented
            options={[
              { value: "yes", label: "On" },
              { value: "no", label: "Off" },
            ]}
            value={p.revisionEnabled ? "yes" : "no"}
            onChange={(v) => set({ revisionEnabled: v === "yes" })}
          />
        </div>
        {p.revisionEnabled && (
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <select className="input !w-auto" value={p.revisionDay} onChange={(e) => set({ revisionDay: Number(e.target.value) })}>
              {WEEKDAYS.map((w, i) => (
                <option key={w} value={i}>
                  {w}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2.5">
              <span className="text-[12.5px] text-ink-2">time reserved</span>
              <Stepper value={p.revisionMinutes} onChange={(v) => set({ revisionMinutes: v })} min={60} max={720} step={30} suffix="min" width="w-[9rem]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
