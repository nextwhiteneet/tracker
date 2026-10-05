import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProfile, getStats, getTodayBundle } from "@/lib/data";
import { quoteOfTheDay } from "@/lib/quotes";
import { todayStr, fmtDay, fmtDate, fmtMinutes } from "@/lib/utils";
import { Greeting } from "@/components/greeting";
import { Ring, WeekBars, ProgressBar, SubjectGlyph } from "@/components/ui";
import { Heatmap } from "@/components/heatmap";
import { CountUp } from "@/components/reveal";
import { TodayPlan, DailyNote, type TodayItem } from "@/components/today-client";
import { AlertTriangle, CalendarDays, Check, Flame, Hourglass, Target } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUser();
  const today = todayStr();
  const [profile, stats, bundle] = await Promise.all([
    getProfile(user.id),
    getStats(user.id),
    getTodayBundle(user.id, today),
  ]);
  const quote = quoteOfTheDay(today);

  const items: TodayItem[] = bundle.items.map((i) => ({
    id: i.id,
    kind: i.kind,
    chapterName: i.chapterName,
    lectureIndex: i.lectureIndex,
    minutes: i.minutes,
    status: i.status,
    subjectName: i.subject?.name ?? "—",
    subjectColor: i.subject?.color ?? "var(--accent)",
    subjectIcon: i.subject?.icon ?? "book-open",
    teacherName: i.teacherName,
  }));

  const plannedToday = items.reduce((a, i) => a + i.minutes, 0);

  return (
    <div className="page-enter space-y-8">
      {/* header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="eyebrow mb-2">{fmtDay(today)}</div>
          <h1 className="font-display text-[2rem] md:text-[2.6rem] leading-[1.06] tracking-tight">
            <Greeting />,{" "}
            <span className="serif-i grad-text">{profile.name.split(" ")[0] || "future doctor"}</span>
          </h1>
          <p className="mt-3 text-[14px] text-ink-2 max-w-lg font-display serif-i text-[15px]">
            “{quote.text}” — <span className="not-italic text-[13px] font-sans">{quote.by}</span>
          </p>
        </div>
        {profile.motto && (
          <div className="chip !py-2 px-4 font-display serif-i text-[13.5px]">“{profile.motto}”</div>
        )}
      </header>

      {/* stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover p-5 anim-rise" style={{ animationDelay: "40ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">NEET in</span>
            <CalendarDays size={15} className="text-ink-3" />
          </div>
          <div className="font-display text-[2.1rem] leading-none">
            <CountUp to={Math.max(0, stats.examDaysLeft)} />
            <span className="text-base text-ink-2 ml-1.5">days</span>
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2 mono">{fmtDate(profile.examDate)}</div>
        </div>

        <div className="card card-hover p-5 anim-rise" style={{ animationDelay: "90ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Streak</span>
            <Flame size={15} className="text-accent streak-pulse" />
          </div>
          <div className="font-display text-[2.1rem] leading-none">
            <CountUp to={stats.streak} />
            <span className="text-base text-ink-2 ml-1.5">days</span>
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">best · {stats.bestStreak} days</div>
        </div>

        <div className="card card-hover p-5 anim-rise" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Planned today</span>
            <Hourglass size={15} className="text-ink-3" />
          </div>
          <div className="font-display text-[2.1rem] leading-none">
            {plannedToday ? fmtMinutes(plannedToday) : "—"}
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">target · {fmtMinutes(profile.dailyTargetMinutes)}</div>
        </div>

        <Link
          href="/dashboard/backlogs"
          className="card card-hover p-5 anim-rise"
          style={{ animationDelay: "190ms" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Backlog</span>
            <AlertTriangle size={15} className={stats.backlogCount ? "text-[var(--bad)]" : "text-[var(--good)]"} />
          </div>
          <div className="font-display text-[2.1rem] leading-none" style={{ color: stats.backlogCount ? "var(--bad)" : "var(--good)" }}>
            {stats.backlogCount || <Check size={30} strokeWidth={2.5} />}
            {stats.backlogCount > 0 && <span className="text-base text-ink-2 ml-1.5">lectures</span>}
          </div>
          <div className="text-[11.5px] text-ink-2 mt-2">
            {stats.backlogCount ? `${fmtMinutes(stats.backlogMinutes)} to clear` : "all clear — stay sharp"}
          </div>
        </Link>
      </div>

      {/* main grid */}
      <div className="grid lg:grid-cols-[1.35fr_1fr] gap-6 items-start">
        <div className="space-y-6">
          <TodayPlan items={items} isToday />
          <DailyNote date={today} initial={bundle.note} />
        </div>

        <div className="space-y-6">
          {/* syllabus ring */}
          <div className="card p-6 anim-rise" style={{ animationDelay: "120ms" }}>
            <div className="eyebrow mb-4">Syllabus</div>
            <div className="flex items-center gap-6">
              <Ring value={stats.syllabusDonePct} size={132} stroke={11}>
                <div className="text-center">
                  <div className="mono text-[1.55rem] font-semibold leading-none">{stats.syllabusDonePct}%</div>
                  <div className="text-[10.5px] text-ink-2 mt-1">complete</div>
                </div>
              </Ring>
              <div className="space-y-2.5 text-[12.5px]">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-accent" />
                  <span className="mono font-semibold">{stats.doneLectures}</span>
                  <span className="text-ink-2">/ {stats.totalSyllabusLectures} lectures</span>
                </div>
                <div className="text-ink-2">
                  <span className="mono font-semibold text-ink">{stats.chaptersDone}</span> / {stats.chaptersTotal} chapters sealed
                </div>
                <div className="text-ink-2">
                  <span className="mono font-semibold text-ink">{stats.revisionsDone}</span> revision rounds done
                </div>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-line space-y-3">
              {stats.bySubject.map((s) => (
                <div key={s.subject.id} className="flex items-center gap-3">
                  <SubjectGlyph icon={s.subject.icon} color={s.subject.color} size={11} />
                  <div className="flex-1">
                    <div className="flex justify-between text-[11.5px] mb-1">
                      <span className="font-medium">{s.subject.name}</span>
                      <span className="mono text-ink-2">
                        {s.doneLectures}/{s.totalLectures}
                      </span>
                    </div>
                    <ProgressBar
                      value={s.totalLectures ? (s.doneLectures / s.totalLectures) * 100 : 0}
                      color={s.subject.color}
                      height={5}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* week bars */}
          <div className="card p-6 anim-rise" style={{ animationDelay: "180ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="eyebrow">Last 7 days</div>
              <Link href="/dashboard/analytics" className="text-[12px] font-medium text-accent hover:underline">
                Full analytics
              </Link>
            </div>
            <WeekBars data={stats.week} target={profile.dailyTargetMinutes} />
            <div className="flex gap-4 mt-3 text-[10.5px] text-ink-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[4px] bg-[var(--line)] inline-block" /> planned</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[4px] bg-[var(--good)] inline-block" /> studied + focus</span>
              <span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-accent inline-block" /> target</span>
            </div>
          </div>
        </div>
      </div>

      {/* heatmap */}
      <div className="card p-6 anim-rise overflow-x-auto" style={{ animationDelay: "220ms" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="eyebrow">Consistency · last 26 weeks</div>
          <span className="chip mono !text-[12px]">{stats.consistency}% consistent · {stats.activeDays} active days</span>
        </div>
        <Heatmap heat={stats.heat} endDate={today} />
      </div>
    </div>
  );
}
