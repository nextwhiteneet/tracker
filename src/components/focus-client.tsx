"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Zap } from "lucide-react";
import { burst } from "./tick";
import { fmtMinutes } from "@/lib/utils";

const PRESETS = [25, 45, 60, 90];

export function FocusClient({
  today,
  initialTodayMin,
  weekMin,
  initialSessions,
}: {
  today: string;
  initialTodayMin: number;
  weekMin: number;
  initialSessions: number;
}) {
  const [target, setTarget] = useState(45 * 60);
  const [remaining, setRemaining] = useState(45 * 60);
  const [state, setState] = useState<"idle" | "running" | "paused">("idle");
  const [immersive, setImmersive] = useState(false);
  const [todayMin, setTodayMin] = useState(initialTodayMin);
  const [sessions, setSessions] = useState(initialSessions);
  const endAt = useRef<number>(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state !== "running") return;
    const iv = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(iv);
        complete();
      }
    }, 250);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (state !== "idle") document.title = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} · Focus — Ascent`;
    else document.title = "Ascent — NEET Preparation Tracker";
    return () => {
      document.title = "Ascent — NEET Preparation Tracker";
    };
  }, [remaining, state]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setImmersive(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const start = () => {
    endAt.current = Date.now() + remaining * 1000;
    setState("running");
  };
  const pause = () => setState("paused");
  const reset = () => {
    setState("idle");
    setRemaining(target);
  };
  const choose = (min: number) => {
    setTarget(min * 60);
    setRemaining(min * 60);
    setState("idle");
  };

  const complete = () => {
    setState("idle");
    const mins = Math.round(target / 60);
    setRemaining(target);
    setTodayMin((m) => m + mins);
    setSessions((s) => s + 1);
    burst();
    startTransition(async () => {
      await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: mins, date: today }),
      });
    });
  };

  const progress = 1 - remaining / target;
  const r = 118;
  const c = 2 * Math.PI * r;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;

  return (
    <div className={`${immersive ? "fixed inset-0 z-[80] grid place-items-center bg-[var(--bg)]" : ""}`}>
      {immersive && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="orb w-[36rem] h-[36rem] top-[-8rem] left-1/2 -translate-x-1/2 bg-accent/20" style={{ animation: "glow-pulse 4s ease-in-out infinite" }} />
        </div>
      )}
      <div className={`relative grid lg:grid-cols-[auto_1fr] gap-10 items-center ${immersive ? "" : "card p-8 md:p-12"}`}>
        {/* timer ring */}
        <div className="relative mx-auto">
          <div className="timer-aura absolute -inset-6 rounded-full opacity-70" style={{ animationPlayState: state === "running" ? "running" : "paused" }} />
          <div className="relative grid place-items-center rounded-full bg-surface border border-line" style={{ width: 280, height: 280 }}>
            <svg width={280} height={280} className="-rotate-90 absolute inset-0">
              <circle cx={140} cy={140} r={r} stroke="var(--line)" strokeWidth={8} fill="none" />
              <circle
                cx={140}
                cy={140}
                r={r}
                stroke="var(--accent)"
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - progress)}
                style={{ transition: "stroke-dashoffset 0.3s linear" }}
              />
            </svg>
            <div className="text-center relative">
              <div className="font-display text-[3.4rem] leading-none tabular-nums">
                {String(mm).padStart(2, "0")}
                <span className="text-ink-3">:</span>
                {String(ss).padStart(2, "0")}
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-3 mt-2">
                {state === "running" ? "focusing" : state === "paused" ? "paused" : "ready"}
              </div>
            </div>
          </div>
        </div>

        {/* controls */}
        <div className={immersive ? "text-center mt-6" : ""}>
          <div className="eyebrow mb-3">Session length</div>
          <div className="flex flex-wrap gap-2 mb-8 justify-start">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => choose(p)}
                className={`rounded-full px-4.5 px-4 py-2 text-[13px] font-medium border transition-all duration-300 ${
                  target === p * 60
                    ? "bg-ink text-bg border-transparent dark:bg-accent dark:text-white"
                    : "border-line-strong text-ink-2 hover:border-ink"
                }`}
              >
                {p} min
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {state === "running" ? (
              <button className="btn btn-primary !px-7 !py-3" onClick={pause}>
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button className="btn btn-accent !px-7 !py-3" onClick={start}>
                <Play size={16} /> {state === "paused" ? "Resume" : "Begin focus"}
              </button>
            )}
            <button className="btn btn-ghost !px-5 !py-3" onClick={reset}>
              <RotateCcw size={15} /> Reset
            </button>
            <button className="btn btn-ghost !px-5 !py-3" onClick={() => setImmersive(!immersive)}>
              {immersive ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              {immersive ? "Exit (esc)" : "Immersive"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5 mt-8">
            <span className="chip"><Zap size={12} className="text-accent" /> Today · {fmtMinutes(todayMin)}</span>
            <span className="chip">This week · {fmtMinutes(weekMin + (todayMin - initialTodayMin))}</span>
            <span className="chip mono">{sessions} sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
