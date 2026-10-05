"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Flame,
  ListChecks,
  TrendingUp,
  RotateCcw,
  Timer,
  Sparkles,
  Check,
} from "lucide-react";
import { Reveal, CountUp } from "@/components/reveal";
import { ThemeToggle } from "@/components/theme";
import { Ring, ProgressBar, WeekBars, SubjectGlyph } from "@/components/ui";

const SUBJECTS = [
  { name: "Physics", color: "#6C64E0", icon: "atom" },
  { name: "Chemistry", color: "#E15A7A", icon: "flask-conical" },
  { name: "Botany", color: "#2FA36B", icon: "leaf" },
  { name: "Zoology", color: "#E29A26", icon: "heart-pulse" },
];

export default function Landing() {
  const week = [
    { date: "2026-02-09", done: 300, planned: 360, focus: 60 },
    { date: "2026-02-10", done: 420, planned: 360, focus: 0 },
    { date: "2026-02-11", done: 240, planned: 300, focus: 90 },
    { date: "2026-02-12", done: 380, planned: 360, focus: 0 },
    { date: "2026-02-13", done: 410, planned: 420, focus: 50 },
    { date: "2026-02-14", done: 330, planned: 300, focus: 25 },
    { date: "2026-02-15", done: 275, planned: 360, focus: 120 },
  ];

  return (
    <main className="relative overflow-x-clip">
      {/* ambient orbs */}
      <div className="orb w-[42rem] h-[42rem] -top-40 -right-40 bg-accent/25 dark:bg-accent/20" style={{ animation: "float-slow 16s ease-in-out infinite" }} />
      <div className="orb w-[36rem] h-[36rem] top-[36rem] -left-56 bg-[#6C64E0]/20 dark:bg-[#6C64E0]/15" style={{ animation: "float-slower 22s ease-in-out infinite" }} />
      <div className="orb w-[30rem] h-[30rem] top-[86rem] right-[-10rem] bg-[#2FA36B]/20 dark:bg-[#2FA36B]/12" style={{ animation: "float-slow 19s ease-in-out infinite" }} />

      {/* nav */}
      <header className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-6xl px-4 pt-4">
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-lg tracking-tight">NEXT WHITE</span>
              <span className="chip hidden sm:inline-flex">NEET UG</span>
            </Link>
            <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-ink-2">
              <a href="#system" className="hover:text-ink transition-colors">System</a>
              <a href="#command" className="hover:text-ink transition-colors">Command centre</a>
              <a href="#ritual" className="hover:text-ink transition-colors">The ritual</a>
            </nav>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Enter tracker <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-36 md:pt-44 pb-16">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
          <div>
            <div className="anim-rise inline-flex items-center gap-2 chip !py-1.5 mb-7" style={{ animationDelay: "0ms" }}>
              <Sparkles size={13} className="text-accent" />
              Your personal NEET command centre
            </div>
            <h1 className="font-display text-[2.9rem] leading-[1.02] md:text-[4.6rem] tracking-tight">
              <span className="block anim-rise" style={{ animationDelay: "60ms" }}>Every lecture,</span>
              <span className="block anim-rise serif-i grad-text pb-2" style={{ animationDelay: "140ms" }}>accounted.</span>
              <span className="block anim-rise" style={{ animationDelay: "220ms" }}>Every rank, earned.</span>
            </h1>
            <p className="anim-rise mt-6 max-w-md text-[15.5px] leading-relaxed text-ink-2" style={{ animationDelay: "300ms" }}>
              A day-by-day plan of every lecture in your syllabus, a tick for each one you
              finish, backlogs that never hide, and pace analytics that tell you exactly
              where you stand — until the day you wear the white coat.
            </p>
            <div className="anim-rise mt-9 flex flex-wrap items-center gap-3.5" style={{ animationDelay: "380ms" }}>
              <Link href="/dashboard" className="btn btn-accent !px-7 !py-3 !text-[15px]">
                Start tracking <ArrowRight size={16} />
              </Link>
              <a href="#system" className="btn btn-ghost !px-6 !py-3 !text-[15px]">
                See the system
              </a>
            </div>
            <div className="anim-fade mt-10 flex items-center gap-5 text-[12.5px] text-ink-2" style={{ animationDelay: "480ms" }}>
              {["No sign-up", "Potato-grade smooth", "Dark mode"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check size={13} className="text-good" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* dashboard preview cluster */}
          <div className="anim-rise relative hidden lg:block" style={{ animationDelay: "260ms" }}>
            <div className="card shadow-lg rounded-3xl p-6 rotate-[1.5deg]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="eyebrow mb-1">Syllabus progress</div>
                  <div className="font-display text-lg">You are on pace</div>
                </div>
                <span className="chip !bg-[var(--good-soft)] !text-[var(--good)] !border-transparent">
                  <TrendingUp size={13} /> ahead
                </span>
              </div>
              <div className="flex items-center gap-6">
                <Ring value={62} size={124} stroke={10}>
                  <div className="text-center">
                    <div className="mono text-2xl font-semibold">62%</div>
                    <div className="text-[10.5px] text-ink-2">syllabus</div>
                  </div>
                </Ring>
                <div className="flex-1 space-y-3.5">
                  {SUBJECTS.map((s, i) => (
                    <div key={s.name}>
                      <div className="flex justify-between text-[11.5px] mb-1">
                        <span className="font-medium">{s.name}</span>
                        <span className="mono text-ink-2">{[71, 64, 58, 55][i]}%</span>
                      </div>
                      <ProgressBar value={[71, 64, 58, 55][i]} color={s.color} height={6} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-line">
                <WeekBars data={week} target={360} />
              </div>
            </div>
            <div className="glass absolute -left-10 -top-8 rounded-2xl px-4 py-3 anim-pop shadow-lg" style={{ animationDelay: "650ms" }}>
              <div className="flex items-center gap-2.5">
                <Flame size={20} className="text-accent streak-pulse" />
                <div>
                  <div className="mono font-semibold leading-none">21 days</div>
                  <div className="text-[10.5px] text-ink-2 mt-0.5">study streak</div>
                </div>
              </div>
            </div>
            <div className="glass absolute -right-6 bottom-16 rounded-2xl px-4 py-3 anim-pop shadow-lg" style={{ animationDelay: "800ms" }}>
              <div className="text-[10.5px] text-ink-2 mb-1">Projected finish</div>
              <div className="mono font-semibold">14 Apr · 23 days early</div>
            </div>
          </div>
        </div>
      </section>

      {/* marquee */}
      <section className="border-y border-line bg-surface py-4 overflow-hidden">
        <div className="marquee">
          {[0, 1].map((n) => (
            <div key={n} className="marquee-track font-display text-lg md:text-xl">
              {["Physics", "Chemistry", "Botany", "Zoology", "Consistency", "Revision", "Streaks", "Zero backlog"].map((w) => (
                <span key={w} className="flex items-center gap-14">
                  <span className="serif-i text-ink-2">{w}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* system */}
      <section id="system" className="mx-auto max-w-6xl px-4 py-24 md:py-32">
        <Reveal>
          <div className="eyebrow mb-3">The system</div>
          <h2 className="font-display text-3xl md:text-[3.2rem] leading-[1.08] max-w-2xl">
            Built like a coach watches over your shoulder,{" "}
            <span className="serif-i grad-text">every single day.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: CalendarCheck,
              title: "The plan engine",
              body: "Tell it your subjects, teachers, chapters, lecture counts and weekly routine. It lays every remaining lecture onto a calendar — with projected finish date — down to the last one before NEET.",
            },
            {
              icon: ListChecks,
              title: "The tick system",
              body: "One tick per lecture. That's the whole ritual. Ticks roll into chapters, chapters into subjects, subjects into the syllabus. Miss one? It quietly moves to your backlog list.",
            },
            {
              icon: TrendingUp,
              title: "Pace analytics",
              body: "Planned vs actual, day over day. Streaks, heatmaps, study minutes, revision rounds — the truth about your preparation, rendered beautifully and without mercy.",
            },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 110}>
              <div className="card card-hover p-7 h-full">
                <div className="w-11 h-11 rounded-2xl grid place-items-center bg-[var(--accent-soft)] text-accent mb-5">
                  <f.icon size={20} />
                </div>
                <h3 className="font-display text-xl mb-2.5">{f.title}</h3>
                <p className="text-[14px] leading-relaxed text-ink-2">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* command centre */}
      <section id="command" className="border-y border-line bg-surface py-24 md:py-32 relative">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="eyebrow mb-3">Command centre</div>
              <h2 className="font-display text-3xl md:text-[3rem] leading-[1.08]">
                Everything a topper tracks, <span className="serif-i grad-text">one calm screen.</span>
              </h2>
            </div>
            <Link href="/dashboard" className="btn btn-ghost">
              Open it <ArrowUpRight size={15} />
            </Link>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: RotateCcw, t: "Backlog rescue", d: "Missed lectures land in one list. Clear them one tick at a time, or re-plan everything in one tap." },
              { icon: RotateCcw, t: "Revision rounds", d: "Finished chapters queue for weekly revision days. Track rounds and confidence per chapter." },
              { icon: Timer, t: "Deep-focus timer", d: "Pomodoro-grade focus sessions that feed your streak and study-minutes analytics." },
              { icon: Flame, t: "Streaks & heatmap", d: "GitHub-style activity heatmap across 26 weeks. Break the chain only if you dare." },
            ].map((f, i) => (
              <Reveal key={f.t} delay={i * 90}>
                <div className="group rounded-3xl border border-line bg-bg p-6 h-full transition-transform duration-500 hover:-translate-y-1.5">
                  <f.icon size={19} className="text-accent mb-4" />
                  <h3 className="font-semibold text-[15px] mb-2">{f.t}</h3>
                  <p className="text-[13.5px] leading-relaxed text-ink-2">{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* numbers */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { v: 100, s: "%", l: "of your syllabus, mapped lecture by lecture" },
              { v: 720, s: "", l: "marks worth of discipline, scheduled" },
              { v: 26, s: " wks", l: "of visible consistency on the heatmap" },
              { v: 1, s: "", l: "goal — the white coat" },
            ].map((n, i) => (
              <Reveal key={n.l} delay={i * 80}>
                <div className="font-display text-4xl md:text-5xl">
                  <CountUp to={n.v} suffix={n.s} />
                </div>
                <div className="mt-2 text-[12.5px] text-ink-2 max-w-[15rem] mx-auto">{n.l}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ritual */}
      <section id="ritual" className="mx-auto max-w-6xl px-4 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <Reveal>
            <div className="eyebrow mb-3">The ritual</div>
            <h2 className="font-display text-3xl md:text-[2.9rem] leading-[1.1]">
              Open it with morning chai. <br />
              <span className="serif-i grad-text">Close it when every tick is green.</span>
            </h2>
            <ul className="mt-9 space-y-5">
              {[
                ["01", "See today's plan — lectures chosen for this weekday, with your teachers and chapter order baked in."],
                ["02", "Watch, understand, tick. Minutes and streak update instantly. Chapter done? Fireworks."],
                ["03", "Glance at pace once a week. If the solid line hugs the dashed one, the rank is coming."],
              ].map(([n, t]) => (
                <li key={n} className="flex gap-4">
                  <span className="mono text-[12px] text-accent font-semibold pt-1">{n}</span>
                  <p className="text-[14.5px] leading-relaxed text-ink-2">{t}</p>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="card rounded-3xl p-7 rotate-[-1deg]">
              <div className="flex items-center justify-between mb-5">
                <div className="eyebrow">Today · plan</div>
                <span className="chip">340 min</span>
              </div>
              <div className="space-y-3">
                {SUBJECTS.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-3.5">
                    <SubjectGlyph icon={s.icon} color={s.color} size={14} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate">
                        {["Current Electricity", "Coordination Compounds", "Molecular Basis of Inheritance", "Body Fluids & Circulation"][i]}
                      </div>
                      <div className="text-[11.5px] text-ink-2">
                        L{i + 3} · {s.name}
                      </div>
                    </div>
                    <span className="tick" data-done={i < 2 ? "true" : undefined} data-today={i === 2 ? "true" : undefined}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-surface-2 border border-line px-4 py-3 text-[12.5px] text-ink-2 font-display serif-i">
                "Small daily improvements are the key to staggering long-term results."
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-ink text-bg px-8 py-16 md:py-20 text-center dark:bg-surface dark:text-ink">
            <div className="orb w-96 h-96 -top-24 left-1/2 -translate-x-1/2 bg-accent/30" style={{ animation: "glow-pulse 5s ease-in-out infinite" }} />
            <h2 className="relative font-display text-3xl md:text-5xl leading-tight">
              The syllabus won't finish itself.
              <br />
              <span className="serif-i grad-text">But it will finish — one tick at a time.</span>
            </h2>
            <div className="relative mt-9">
              <Link href="/dashboard" className="btn btn-accent !px-8 !py-3.5 !text-[15px]">
                Begin your journey <ArrowRight size={16} />
              </Link>
            </div>
            <p className="relative mt-5 text-[12.5px] text-bg/60 dark:text-ink-2">Free to use · set up in 4 minutes · your data stays private to your account</p>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-ink-2">
          <div className="flex items-center gap-2">
            <LogoMark small /> <span className="font-display text-sm">NEXT WHITE</span> — a personal NEET preparation tracker
          </div>
          <div className="mono">trust the process</div>
        </div>
      </footer>
    </main>
  );
}

export function LogoMark({ small = false }: { small?: boolean }) {
  const s = small ? 22 : 30;
  return (
    <span
      className="grid place-items-center rounded-xl bg-ink dark:bg-accent flex-none leading-none"
      style={{ width: s, height: s, fontSize: s * 0.62 }}
      aria-hidden="true"
    >
      🥼
    </span>
  );
}
