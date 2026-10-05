import { addDays, dayOfWeek, toStr, fromStr, fmtMinutes } from "@/lib/utils";

/** GitHub-style activity heatmap. Server-safe, zero JS on render. */
export function Heatmap({
  heat,
  weeks = 26,
  endDate,
}: {
  heat: Record<string, number>;
  weeks?: number;
  endDate: string;
}) {
  // End at upcoming Saturday of endDate's week for a clean grid
  const end = fromStr(endDate);
  const endDow = end.getDay();
  const endCol = toStr(new Date(end.getTime() + (6 - endDow) * 86400000));
  const start = addDays(endCol, -(weeks * 7 - 1));

  const level = (m: number) => (m === 0 ? 0 : m < 60 ? 1 : m < 150 ? 2 : m < 270 ? 3 : 4);
  const colors = [
    "var(--surface-2)",
    "color-mix(in srgb, var(--good) 22%, var(--surface))",
    "color-mix(in srgb, var(--good) 42%, var(--surface))",
    "color-mix(in srgb, var(--good) 62%, var(--surface))",
    "var(--good)",
  ];

  const cols: string[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: string[] = [];
    for (let d = 0; d < 7; d++) col.push(addDays(start, w * 7 + d));
    cols.push(col);
  }

  const months: Array<{ label: string; col: number }> = [];
  let lastMonth = -1;
  cols.forEach((col, i) => {
    const m = fromStr(col[0]).getMonth();
    if (m !== lastMonth && (months.length === 0 || i - months[months.length - 1].col > 2)) {
      months.push({
        label: fromStr(col[0]).toLocaleString("en", { month: "short" }),
        col: i,
      });
      lastMonth = m;
    }
  });

  return (
    <div>
      <div className="relative h-4 mb-1.5">
        {months.map((m) => (
          <span
            key={m.label + m.col}
            className="absolute text-[10px] text-ink-3 mono"
            style={{ left: `calc(${m.col} * (11px + 3px))` }}
          >
            {m.label}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((d) => {
              const future = d > endDate;
              const m = heat[d] ?? 0;
              return (
                <span
                  key={d}
                  className="heat-cell"
                  title={`${d.split("-").reverse().join("/")} · ${m ? fmtMinutes(m) : "no activity"}`}
                  style={{
                    background: future ? "transparent" : colors[level(m)],
                    borderColor: future ? "var(--line)" : undefined,
                    opacity: future ? 0.35 : 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[10.5px] text-ink-3">
        Less
        {colors.map((c) => (
          <span key={c} className="heat-cell !cursor-default hover:!transform-none" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  );
}
