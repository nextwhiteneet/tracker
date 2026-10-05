"use client";

import { useState, useTransition } from "react";
import { BookMarked, History, RotateCcw } from "lucide-react";
import { SubjectGlyph, ProgressBar } from "./ui";
import { fmtDate, todayStr } from "@/lib/utils";

export interface RevChapter {
  id: number;
  name: string;
  cls: number;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  rounds: number;
  confidence: number;
  lastRevisedOn: string | null;
}

interface InProgress {
  id: number;
  name: string;
  done: number;
  total: number;
  subjectName: string;
  subjectColor: string;
}

export function RevisionClient({
  completed,
  inProgress,
}: {
  completed: RevChapter[];
  inProgress: InProgress[];
}) {
  const [rows, setRows] = useState(completed);
  const [, startTransition] = useTransition();

  const act = (chapterId: number, action: "round" | "confidence", value?: number) => {
    // optimistic
    setRows((rs) =>
      rs.map((r) =>
        r.id === chapterId
          ? action === "round"
            ? { ...r, rounds: r.rounds + 1, lastRevisedOn: todayStr() }
            : { ...r, confidence: r.confidence === value ? 0 : (value ?? 0) }
          : r
      )
    );
    startTransition(async () => {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId, action, value }),
      });
      const json = await res.json();
      if (json.ok && json.revision) {
        setRows((rs) => rs.map((r) => (r.id === chapterId ? { ...r, rounds: json.revision.rounds, confidence: json.revision.confidence, lastRevisedOn: json.revision.lastRevisedOn } : r)));
      }
    });
  };

  // weakest confidence first, then never-revised
  const sorted = [...rows].sort((a, b) => a.confidence - b.confidence || a.rounds - b.rounds);

  return (
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="card p-10 text-center">
            <BookMarked size={26} className="mx-auto text-accent mb-3" />
            <div className="font-display text-xl">Nothing to revise — yet</div>
            <p className="text-sm text-ink-2 mt-1.5 max-w-sm mx-auto">
              Finish every lecture of a chapter and it will land here, ready for round after round of revision.
            </p>
          </div>
        )}
        {sorted.map((r, i) => (
          <div
            key={r.id}
            className="anim-rise card !shadow-none p-4.5 p-4 flex flex-wrap items-center gap-x-5 gap-y-3"
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms`, animationDuration: "0.5s" }}
          >
            <SubjectGlyph icon={r.subjectIcon} color={r.subjectColor} size={15} />
            <div className="flex-1 min-w-44">
              <div className="text-[14px] font-medium">{r.name}</div>
              <div className="text-[11.5px] text-ink-2 mt-0.5 flex flex-wrap items-center gap-x-2">
                <span style={{ color: r.subjectColor }} className="font-medium">{r.subjectName}</span>
                <span className="mono uppercase text-[10px]">class {r.cls}</span>
                {r.lastRevisedOn && (
                  <span className="inline-flex items-center gap-1">
                    <History size={11} /> last · {fmtDate(r.lastRevisedOn)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1" title="Confidence — tap to rate">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => act(r.id, "confidence", v)}
                  className="w-3.5 h-3.5 rounded-full border transition-all duration-300 hover:scale-125"
                  style={{
                    borderColor: v <= r.confidence ? "transparent" : "var(--line-strong)",
                    background: v <= r.confidence ? (r.confidence <= 2 ? "var(--bad)" : r.confidence <= 3 ? "var(--warn)" : "var(--good)") : "transparent",
                  }}
                  aria-label={`confidence ${v}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2.5">
              <span className="chip mono !text-[11px]">
                {r.rounds === 0 ? "not revised" : `${r.rounds}× revised`}
              </span>
              <button className="btn btn-soft btn-xs" onClick={() => act(r.id, "round")}>
                <RotateCcw size={12} /> Revised today
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="eyebrow mb-4">In progress</div>
        <p className="text-[12px] text-ink-2 mb-4 -mt-2">
          Chapters you're mid-way through — they'll join the vault when sealed.
        </p>
        <div className="space-y-3.5">
          {inProgress.slice(0, 10).map((c) => (
            <div key={c.id}>
              <div className="flex justify-between text-[12px] mb-1">
                <span className="font-medium truncate pr-3">{c.name}</span>
                <span className="mono text-ink-2 flex-none">{c.done}/{c.total}</span>
              </div>
              <ProgressBar value={(c.done / Math.max(1, c.total)) * 100} color={c.subjectColor} height={5} />
            </div>
          ))}
          {!inProgress.length && (
            <p className="text-[12.5px] text-ink-2">No chapters in progress. Go tick a lecture.</p>
          )}
        </div>
      </div>
    </div>
  );
}
