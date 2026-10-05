import { getStats, getProfile } from "@/lib/data";
import { requireUser } from "@/lib/auth";
import { SectionHead, PaceChart, Donut, ProgressBar, SubjectGlyph } from "@/components/ui";
import { Heatmap } from "@/components/heatmap";
import { CountUp } from "@/components/reveal";
import { fmtDate, fmtHours, fmtMinutes, todayStr, diffDays } from "@/lib/utils";
import { Clock3, BookOpenCheck, Percent, Flag, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [stats, profile] = await Promise.all([getStats(user.id), getProfile(user.id)]);
  const today = todayStr();

  const studiedTotal = stats.doneMinutes + stats.focusMinutesTotal;
  const finishDelta = stats.finishDate ? diffDays(stats.finishDate, profile.examDate) : null;
  const onTime = finishDelta === null || finishDelta >= 0;

  const donut = stats.bySubject
    .filter((s) => s.doneLectures > 0)
    .map((s) => ({ color: s.subject.color, value: s.doneLectures, label: s.subject.name }));

  return (
    <div className="page-enter space-y-8">
      <SectionHead
        eyebrow="Analytics"
        title="The truth about your preparation, in numbers."
        sub="Planned vs actual pace, subject balance, study hours and consistency — all derived from your ticks."
      />

      {/* top cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Time invested</span>
            <Clock3 size={15} className="text-ink-3" />
          </div>
          <div className="font-display text-[2rem] leading-none">
            <CountUp to={Math.round(studiedTotal / 60)} suffix="h" />
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">
            {fmtHours(stats.doneMinutes)} lectures · {fmtHours(stats.focusMinutesTotal)} deep focus
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Lectures done</span>
            <BookOpenCheck size={15} className="text-ink-3" />
          </div>
          <div className="font-display text-[2rem] leading-none">
            <CountUp to={stats.doneLectures} />
            <span className="text-base text-ink-2">/{stats.totalLectures + stats.backlogCount}</span>
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">{stats.chaptersDone} chapters fully sealed</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Consistency</span>
            <Percent size={15} className="text-ink-3" />
          </div>
          <div className="font-display text-[2rem] leading-none">
            <CountUp to={stats.consistency} suffix="%" />
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">{stats.activeDays} active days total</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Finish projection</span>
            {onTime ? <TrendingUp size={15} className="text-[var(--good)]" /> : <TrendingDown size={15} className="text-[var(--bad)]" />}
          </div>
          <div className="font-display text-[1.6rem] leading-tight" style={{ color: onTime ? "var(--good)" : "var(--bad)" }}>
            {stats.finishDate ? fmtDate(stats.finishDate) : "Done!"}
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">
            {finishDelta === null
              ? "syllabus complete — now it's all revision"
              : finishDelta >= 0
                ? `${finishDelta} days before NEET · ${finishDelta >= 21 ? "comfortably" : "tightly"} on time`
                : `${Math.abs(finishDelta)} days past NEET — increase daily load`}
          </div>
        </div>
      </div>

      {/* pace chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="eyebrow mb-1">Pace · cumulative lectures</div>
            <div className="font-display text-lg">The solid line must hug the dashed one</div>
          </div>
          <div className="flex gap-4 text-[11px] text-ink-2">
            <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[var(--ink-3)] inline-block" /> planned</span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-[var(--good)] inline-block" /> actual</span>
          </div>
        </div>
        <PaceChart planned={stats.pacePlanned} actual={stats.paceActual} today={today} />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.35fr] gap-6 items-start">
        {/* donut */}
        <div className="card p-6">
          <div className="eyebrow mb-5">Lecture distribution</div>
          <div className="flex items-center gap-7">
            <Donut
              segments={donut}
              size={150}
              stroke={18}
              center={
                <div>
                  <div className="mono text-xl font-semibold">{stats.doneLectures}</div>
                  <div className="text-[10px] text-ink-2">lectures</div>
                </div>
              }
            />
            <ul className="space-y-2.5">
              {stats.bySubject.map((s) => (
                <li key={s.subject.id} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="w-2.5 h-2.5 rounded-[4px]" style={{ background: s.subject.color }} />
                  <span className="font-medium">{s.subject.name}</span>
                  <span className="mono text-ink-2 text-[11.5px]">{fmtMinutes(s.doneMinutes)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* subject table */}
        <div className="card p-6">
          <div className="eyebrow mb-5">Subject report</div>
          <div className="space-y-5">
            {stats.bySubject.map((s) => {
              const p = s.totalLectures ? Math.round((s.doneLectures / s.totalLectures) * 100) : 0;
              return (
                <div key={s.subject.id} className="flex items-center gap-4">
                  <SubjectGlyph icon={s.subject.icon} color={s.subject.color} size={16} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[12.5px] mb-1.5">
                      <span className="font-medium">{s.subject.name}</span>
                      <span className="mono text-ink-2 text-[11.5px]">
                        {s.chaptersDone}/{s.chaptersTotal} ch · {s.doneLectures}/{s.totalLectures} lec · {p}%
                      </span>
                    </div>
                    <ProgressBar value={p} color={s.subject.color} height={6} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* big heatmap */}
      <div className="card p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="eyebrow mb-1">Consistency heatmap</div>
            <div className="font-display text-lg">26 weeks of showing up</div>
          </div>
          <Flag size={16} className="text-accent" />
        </div>
        <Heatmap heat={stats.heat} endDate={today} weeks={26} />
      </div>
    </div>
  );
}
