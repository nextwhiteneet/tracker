import {
  Atom,
  FlaskConical,
  Leaf,
  HeartPulse,
  BookOpen,
  Microscope,
  Brain,
  Calculator,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  atom: Atom,
  "flask-conical": FlaskConical,
  leaf: Leaf,
  "heart-pulse": HeartPulse,
  "book-open": BookOpen,
  microscope: Microscope,
  brain: Brain,
  calculator: Calculator,
};

export function SubjectGlyph({
  icon,
  color,
  size = 18,
}: {
  icon: string;
  color: string;
  size?: number;
}) {
  const Icon = ICONS[icon] ?? BookOpen;
  return (
    <span
      className="grid place-items-center rounded-xl flex-none"
      style={{
        width: size * 2,
        height: size * 2,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        color,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}

/** SVG progress ring with animated stroke. */
export function Ring({
  value,
  size = 148,
  stroke = 11,
  color = "var(--accent)",
  track = "var(--line)",
  children,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="ring-anim"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function ProgressBar({
  value,
  color = "var(--good)",
  height = 7,
  className = "",
}: {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full ${className}`}
      style={{ height, background: "var(--line)" }}
    >
      <div
        className="h-full rounded-full ring-anim"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  right,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="font-display text-2xl md:text-[1.7rem] leading-tight">{title}</h2>
        {sub && <p className="text-sm text-ink-2 mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ------------------------- Pure SVG charts ------------------------- */

export function WeekBars({
  data,
  target,
}: {
  data: Array<{ date: string; done: number; planned: number; focus: number }>;
  target: number; // daily target minutes
}) {
  const W = 340;
  const H = 132;
  const padB = 22;
  const max = Math.max(target, ...data.map((d) => Math.max(d.done, d.planned)), 60);
  const bw = 16;
  const gap = (W - data.length * bw * 2) / (data.length + 1);
  const y = (v: number) => H - padB - (v / max) * (H - padB - 14);
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Last 7 days study minutes">
      {/* target line */}
      <line
        x1={0}
        x2={W}
        y1={y(target)}
        y2={y(target)}
        stroke="var(--accent)"
        strokeDasharray="4 5"
        strokeWidth={1}
        opacity={0.6}
      />
      {data.map((d, i) => {
        const x0 = gap + i * (gap + bw * 2);
        const studied = d.done + d.focus;
        const hDone = Math.max(2, H - padB - y(studied));
        return (
          <g key={d.date}>
            <rect
              x={x0}
              y={H - padB - Math.max(2, H - padB - y(d.planned))}
              width={bw}
              height={Math.max(2, H - padB - y(d.planned))}
              rx={5}
              fill="var(--line)"
            />
            <rect x={x0 + bw + 3} y={y(studied)} width={bw} height={hDone} rx={5} fill="var(--good)">
              <title>{`${Math.round(studied)}m studied · ${Math.round(d.planned)}m planned`}</title>
            </rect>
            <text
              x={x0 + bw + 1.5}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--ink-3)"
              fontFamily="var(--font-mono), monospace"
            >
              {days[new Date(d.date + "T12:00:00").getDay()]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  segments,
  size = 168,
  stroke = 20,
  center,
}: {
  segments: Array<{ color: string; value: number; label: string }>;
  size?: number;
  stroke?: number;
  center?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = Math.max(1, segments.reduce((a, s) => a + s.value, 0));
  let acc = 0;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${Math.max(0, dash - 2)} ${c}`}
              strokeDashoffset={-acc * c}
              strokeLinecap="butt"
              className="ring-anim"
            >
              <title>{`${s.label}: ${Math.round(s.value)} lectures`}</title>
            </circle>
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

/** Cumulative pace chart — planned (dashed) vs actual (solid area). */
export function PaceChart({
  planned,
  actual,
  today,
}: {
  planned: Array<{ date: string; v: number }>;
  actual: Array<{ date: string; v: number }>;
  today: string;
}) {
  const W = 640;
  const H = 220;
  const padL = 34;
  const padB = 26;
  const padT = 10;

  if (!planned.length) return <div className="text-sm text-ink-2">Plan data will appear here.</div>;

  const dates = planned.map((p) => p.date);
  const minD = dates[0];
  const maxD = dates[dates.length - 1];
  const span = Math.max(1, new Date(maxD).getTime() - new Date(minD).getTime());
  const maxV = Math.max(1, planned[planned.length - 1].v);

  const x = (d: string) => padL + ((new Date(d).getTime() - new Date(minD).getTime()) / span) * (W - padL - 12);
  const y = (v: number) => H - padB - (v / maxV) * (H - padT - padB);

  const plannedPath = planned.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const actualPts = actual.filter((a) => a.date <= today);
  const actualPath = actualPts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const areaPath = actualPts.length
    ? `${actualPath} L${x(actualPts[actualPts.length - 1].date).toFixed(1)},${H - padB} L${x(actualPts[0].date).toFixed(1)},${H - padB} Z`
    : "";
  const todayX = today >= minD && today <= maxD ? x(today) : null;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => Math.round((maxV / ticks) * i));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Pace chart">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - 12} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
          <text x={padL - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-mono), monospace">
            {t}
          </text>
        </g>
      ))}
      {areaPath && <path d={areaPath} fill="color-mix(in srgb, var(--good) 14%, transparent)" />}
      <path d={plannedPath} fill="none" stroke="var(--ink-3)" strokeWidth={1.6} strokeDasharray="5 6" />
      {actualPath && <path d={actualPath} fill="none" stroke="var(--good)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />}
      {todayX && (
        <g>
          <line x1={todayX} x2={todayX} y1={padT} y2={H - padB} stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="3 4" />
          <text x={todayX} y={H - 8} textAnchor="middle" fontSize={10} fill="var(--accent)" fontFamily="var(--font-mono), monospace">
            today
          </text>
        </g>
      )}
      <text x={W - 12} y={y(maxV) - 6} textAnchor="end" fontSize={10} fill="var(--ink-3)" fontFamily="var(--font-mono), monospace">
        finish · {planned[planned.length - 1].date.slice(5).split("-").reverse().join("/")}
      </text>
    </svg>
  );
}
