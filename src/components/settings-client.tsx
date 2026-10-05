"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Download,
  Loader2,
  RefreshCw,
  Save,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import {
  type Draft,
  ProfileEditor,
  SubjectsEditor,
  ChaptersEditor,
  RoutineEditor,
  EngineEditor,
} from "./config-editors";
import { draftFromConfig, toPayload, type ConfigJson } from "./setup-client";

function Section({
  title,
  sub,
  children,
  defaultOpen = false,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 hover:bg-surface-2 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div>
          <div className="font-display text-[1.2rem]">{title}</div>
          <div className="text-[12px] text-ink-2 mt-0.5">{sub}</div>
        </div>
        <ChevronDown size={18} className={`text-ink-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-6 pt-1 border-t border-line anim-fade" style={{ animationDuration: "0.4s" }}>{children}</div>}
    </div>
  );
}

export function SettingsClient({ config }: { config: ConfigJson }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => draftFromConfig(config));
  const [saving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const [replanning, startReplan] = useTransition();
  const [resetting, startReset] = useTransition();

  const update = (fn: (d: Draft) => Draft) => {
    setSaved(false);
    setDraft((d) => fn(d));
  };

  const initial = useMemo(() => JSON.stringify(toPayload(draftFromConfig(config), true)), [config]);
  const dirty = JSON.stringify(toPayload(draft, true)) !== initial;

  const save = () =>
    startSave(async () => {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft, true)),
      });
      if ((await res.json()).ok) {
        setSaved(true);
        router.refresh();
      }
    });

  const replan = () =>
    startReplan(async () => {
      await fetch("/api/regenerate", { method: "POST" });
      router.refresh();
    });

  const hardReset = () => {
    if (!confirm("This erases everything — plan, progress, streaks. Sure?")) return;
    if (!confirm("Absolutely sure? There is no undo.")) return;
    startReset(async () => {
      await fetch("/api/reset", { method: "POST" });
      router.push("/setup");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 pb-24">
      <Section title="Profile & goals" sub="Name, motto, exam date, daily target" defaultOpen>
        <ProfileEditor draft={draft} update={update} />
      </Section>

      <Section title="Subjects & teachers" sub="Rename subjects, set lecture lengths, manage your teachers">
        <SubjectsEditor draft={draft} update={update} />
      </Section>

      <Section title="Chapters & lecture counts" sub="Add or remove chapters, adjust lecture counts as your batch progresses">
        <ChaptersEditor draft={draft} update={update} />
      </Section>

      <Section title="Weekly routine" sub="Subjects and lecture counts per weekday">
        <RoutineEditor draft={draft} update={update} />
      </Section>

      <Section title="Plan engine" sub="Playback speed, study style, revision day">
        <EngineEditor draft={draft} update={update} />
      </Section>

      <Section title="Data & danger zone" sub="Re-plan, export, or start over">
        <div className="flex flex-wrap gap-3 pt-2">
          <button className="btn btn-ghost" onClick={replan} disabled={replanning}>
            {replanning ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Smart re-plan from today
          </button>
          <a className="btn btn-ghost" href="/api/export" download="ascent-backup.json">
            <Download size={15} /> Export everything (JSON)
          </a>
          <button className="btn btn-ghost !border-[var(--bad)]/40 !text-[var(--bad)] hover:!border-[var(--bad)]" onClick={hardReset} disabled={resetting}>
            {resetting ? <Loader2 size={15} className="animate-spin" /> : <TriangleAlert size={15} />}
            Reset everything
          </button>
        </div>
        <p className="text-[12px] text-ink-2 mt-4 leading-relaxed max-w-xl">
          Smart re-plan keeps every tick you've earned and re-schedules all remaining lectures from
          today onward — including backlogs. Saving any change above also re-plans automatically.
        </p>
      </Section>

      {/* sticky save bar */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
        style={{
          opacity: dirty || saved ? 1 : 0,
          transform: `translateX(-50%) translateY(${dirty || saved ? 0 : 20}px)`,
          pointerEvents: dirty || saved ? "auto" : "none",
        }}
      >
        <div className="glass rounded-full shadow-lg pl-5 pr-2 py-2 flex items-center gap-4">
          <span className="text-[12.5px] text-ink-2">
            {saved && !dirty ? "Saved — plan rebuilt." : "Unsaved changes"}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setDraft(draftFromConfig(config))} disabled={!dirty || saving}>
            <Undo2 size={13} /> Discard
          </button>
          <button className="btn btn-accent btn-sm" onClick={save} disabled={!dirty || saving}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save & re-plan
          </button>
        </div>
      </div>
    </div>
  );
}
