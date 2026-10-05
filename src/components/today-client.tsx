"use client";

import { useRef, useState } from "react";
import { Check, GraduationCap, PartyPopper, StickyNote, Timer } from "lucide-react";
import { TickButton, burst } from "./tick";
import { SubjectGlyph } from "./ui";
import { fmtMinutes } from "@/lib/utils";

export interface TodayItem {
  id: number;
  kind: string;
  chapterName: string;
  lectureIndex: number;
  minutes: number;
  status: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  teacherName: string;
}

export function TodayPlan({
  items,
  isToday,
}: {
  items: TodayItem[];
  isToday: boolean;
}) {
  const doneInit = items.filter((i) => i.status === "done");
  const [doneMin, setDoneMin] = useState(doneInit.reduce((a, i) => a + i.minutes, 0));
  const [doneCount, setDoneCount] = useState(doneInit.length);
  const celebrated = useRef(false);
  const totalMin = items.reduce((a, i) => a + i.minutes, 0);

  const onToggled = (done: boolean, minutes: number) => {
    const nd = doneCount + (done ? 1 : -1);
    setDoneCount(nd);
    setDoneMin((m) => m + (done ? minutes : -minutes));
    if (done && nd === items.length && items.length > 0 && !celebrated.current) {
      celebrated.current = true;
      burst();
    }
    if (!done) celebrated.current = false;
  };

  if (!items.length) {
    return (
      <div className="card p-8 text-center">
        <PartyPopper size={26} className="mx-auto text-accent mb-3" />
        <div className="font-display text-xl">Rest day</div>
        <p className="text-sm text-ink-2 mt-1.5">
          Nothing is scheduled for today. Revise lightly, hydrate, and protect the streak with a focus session.
        </p>
      </div>
    );
  }

  const allDone = doneCount === items.length;
  const teachersToday = Array.from(
    new Set(items.filter((i) => i.kind !== "revision" && i.teacherName).map((i) => i.teacherName))
  );

  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="eyebrow">{isToday ? "Today's plan" : "Plan"}</div>
        <span className="chip mono !text-[12px]">
          {doneCount}/{items.length} · {fmtMinutes(doneMin)} / {fmtMinutes(totalMin)}
        </span>
      </div>

      {teachersToday.length > 0 && (
        <div className="-mt-2 mb-4 flex items-center gap-1.5 text-[12px] text-ink-2">
          <GraduationCap size={13} /> {isToday ? "Today's lectures" : "Lectures"} by {teachersToday.join(", ")}
        </div>
      )}

      {allDone && (
        <div className="anim-pop mb-5 rounded-2xl border border-[var(--good)]/30 bg-[var(--good-soft)] px-4 py-3 text-[13.5px] text-[var(--good)] font-medium flex items-center gap-2">
          <Check size={16} strokeWidth={3} /> Every tick green. This is how ranks are made.
        </div>
      )}

      <ul className="space-y-2.5">
        {items.map((it, idx) => {
          const revision = it.kind === "revision";
          return (
            <li
              key={it.id}
              className="anim-rise flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong"
              style={{ animationDelay: `${idx * 45}ms`, animationDuration: "0.55s" }}
            >
              <SubjectGlyph icon={it.subjectIcon} color={it.subjectColor} size={14} />
              <div className="flex-1 min-w-0">
                <div className={`text-[14px] font-medium truncate ${it.status === "done" ? "line-through opacity-60" : ""}`}>
                  {revision ? `Revise · ${it.chapterName}` : it.chapterName}
                </div>
                <div className="text-[11.5px] text-ink-2 mt-0.5 flex items-center gap-1.5">
                  <span style={{ color: it.subjectColor }} className="font-medium">{it.subjectName}</span>
                  {!revision && <span>· Lecture {it.lectureIndex}</span>}
                  {!revision && it.teacherName && (
                    <span className="inline-flex items-center gap-1">
                      · <GraduationCap size={11} /> {it.teacherName}
                    </span>
                  )}
                  <span>· </span>
                  <span className="inline-flex items-center gap-1">
                    <Timer size={11} /> {fmtMinutes(it.minutes)}
                  </span>
                </div>
              </div>
              <TickButton id={it.id} initialDone={it.status === "done"} isToday={isToday} onToggled={onToggled} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DailyNote({ date, initial }: { date: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (v: string) => {
    setText(v);
    setSaved("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await fetch("/api/note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, text: v }),
      });
      setSaved("saved");
      setTimeout(() => setSaved("idle"), 1600);
    }, 700);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="eyebrow flex items-center gap-1.5">
          <StickyNote size={13} /> Daily note
        </div>
        <span className="text-[10.5px] text-ink-3 mono transition-opacity duration-500" style={{ opacity: saved === "idle" ? 0 : 1 }}>
          {saved === "saving" ? "saving…" : "saved"}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="How did today go? What needs a second look tomorrow?"
        className="input resize-none !bg-transparent !border-0 !p-0 !shadow-none text-[13.5px] leading-relaxed placeholder:text-ink-3"
      />
    </div>
  );
}
