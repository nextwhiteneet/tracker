"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

export async function burst() {
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#E85C22", "#2FA36B", "#6C64E0", "#E29A26", "#E15A7A"];
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 32,
    gravity: 0.9,
    ticks: 180,
    origin: { y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });
}

/** Optimistic circular tick (used on Today / Backlogs). */
export function TickButton({
  id,
  initialDone,
  isToday = false,
  onToggled,
}: {
  id: number;
  initialDone: boolean;
  isToday?: boolean;
  onToggled?: (done: boolean, minutes: number) => void;
}) {
  const [done, setDone] = useState(initialDone);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, done: next }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error();
        if (next && json.chapterJustCompleted) burst();
        onToggled?.(next, json.item?.minutes ?? 0);
      } catch {
        setDone(!next);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      aria-label={done ? "Mark as not done" : "Mark as done"}
      className="tick"
      data-done={done ? "true" : undefined}
      data-today={isToday ? "true" : undefined}
    >
      <Check size={14} strokeWidth={3.2} />
    </button>
  );
}

/** Optimistic square lecture pill (used on Tracker). */
export function PillButton({
  id,
  index,
  initialDone,
  isToday = false,
  isBacklog = false,
}: {
  id: number;
  index: number;
  initialDone: boolean;
  isToday?: boolean;
  isBacklog?: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      try {
        const res = await fetch("/api/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, done: next }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error();
        if (next && json.chapterJustCompleted) burst();
      } catch {
        setDone(!next);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      className="pill"
      data-done={done ? "true" : undefined}
      data-today={isToday ? "true" : undefined}
      data-backlog={isBacklog ? "true" : undefined}
      title={done ? `Lecture ${index} · done (tap to undo)` : `Lecture ${index} · tap when done`}
    >
      {done ? <Check size={12} strokeWidth={3.2} /> : index}
    </button>
  );
}
