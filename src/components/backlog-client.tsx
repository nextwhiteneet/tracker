"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { TickButton } from "./tick";
import { SubjectGlyph } from "./ui";
import { fmtDay, fmtMinutes, groupBy } from "@/lib/utils";

export interface BacklogItem {
  id: number;
  date: string;
  kind: string;
  chapterName: string;
  lectureIndex: number;
  minutes: number;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
}

export function BacklogClient({ items }: { items: BacklogItem[] }) {
  const router = useRouter();
  const [cleared, setCleared] = useState<Record<number, boolean>>({});
  const [replanning, startReplan] = useTransition();

  const remaining = items.filter((i) => !cleared[i.id]);
  const remainingMin = remaining.reduce((a, i) => a + i.minutes, 0);
  const byDate = groupBy(remaining, (i) => i.date);
  const dates = Object.keys(byDate).sort();

  return (
    <div className="space-y-6">
      <div className="card p-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 flex-1">
          <div
            className="grid place-items-center w-14 h-14 rounded-2xl flex-none"
            style={{
              background: remaining.length ? "var(--bad-soft)" : "var(--good-soft)",
              color: remaining.length ? "var(--bad)" : "var(--good)",
            }}
          >
            {remaining.length ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <div className="font-display text-[1.35rem] leading-tight">
              {remaining.length ? (
                <>
                  {remaining.length} pending ·{" "}
                  <span className="mono text-[1.1rem]">{fmtMinutes(remainingMin)}</span>
                </>
              ) : (
                "Zero backlog"
              )}
            </div>
            <p className="text-[13px] text-ink-2 mt-0.5">
              {remaining.length
                ? "Every day these sit, the finish line moves. Attack the oldest first."
                : "Clean slate. This is exactly where toppers live."}
            </p>
          </div>
        </div>
        {remaining.length > 0 && (
          <button
            className="btn btn-accent"
            disabled={replanning}
            onClick={() =>
              startReplan(async () => {
                await fetch("/api/regenerate", { method: "POST" });
                router.refresh();
              })
            }
          >
            <RefreshCw size={15} className={replanning ? "animate-spin" : ""} />
            {replanning ? "Re-planning…" : "Smart re-plan"}
          </button>
        )}
      </div>

      {dates.map((d, di) => (
        <section key={d} className="anim-rise" style={{ animationDelay: `${Math.min(di, 6) * 60}ms` }}>
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="chip mono !text-[11px]">{fmtDay(d)}</span>
            <span className="text-[11.5px] text-ink-3">
              {byDate[d].length} lecture{byDate[d].length > 1 ? "s" : ""} · {fmtMinutes(byDate[d].reduce((a, i) => a + i.minutes, 0))}
            </span>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>
          <ul className="space-y-2.5">
            {byDate[d].map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-3.5"
              >
                <SubjectGlyph icon={it.subjectIcon} color={it.subjectColor} size={14} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate">
                    {it.kind === "revision" ? `Revise · ${it.chapterName}` : it.chapterName}
                  </div>
                  <div className="text-[11.5px] text-ink-2 mt-0.5">
                    <span style={{ color: it.subjectColor }} className="font-medium">{it.subjectName}</span>
                    {it.kind !== "revision" && <span> · Lecture {it.lectureIndex}</span>}
                    <span> · {fmtMinutes(it.minutes)}</span>
                  </div>
                </div>
                <span className="chip !text-[10.5px] !border-[var(--bad)]/30 !text-[var(--bad)] hidden sm:inline-flex">overdue</span>
                <TickButton
                  id={it.id}
                  initialDone={false}
                  onToggled={(done) => done && setCleared((c) => ({ ...c, [it.id]: true }))}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!remaining.length && (
        <div className="card p-10 text-center anim-pop">
          <CheckCheck size={30} className="mx-auto text-[var(--good)] mb-3" />
          <div className="font-display text-xl">All caught up.</div>
          <p className="text-sm text-ink-2 mt-1">Now go protect that streak on today's plan.</p>
        </div>
      )}
    </div>
  );
}
