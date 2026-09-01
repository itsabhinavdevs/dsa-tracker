"use client";

import { useMemo, useState } from "react";

// data: { "YYYY-MM-DD": count }
export default function Heatmap({ data = {}, weeks = 20, accent = "#4FD1C5", label = "items" }) {
  const [hover, setHover] = useState(null);

  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalDays = weeks * 7;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const id = d.toISOString().slice(0, 10);
      out.push({ id, count: data[id] || 0 });
    }
    return out;
  }, [data, weeks]);

  const columns = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  const max = Math.max(1, ...days.map((d) => d.count));

  function shade(count) {
    if (!count) return "#1D222B";
    const ratio = count / max;
    if (ratio > 0.75) return accent;
    if (ratio > 0.5) return accent + "cc";
    if (ratio > 0.25) return accent + "88";
    return accent + "44";
  }

  return (
    <div className="relative">
      <div className="flex gap-[3px]">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((d) => (
              <div
                key={d.id}
                onMouseEnter={() => setHover(d)}
                onMouseLeave={() => setHover(null)}
                style={{ background: shade(d.count) }}
                className="w-[11px] h-[11px] rounded-[2px] cursor-default transition-colors"
              />
            ))}
          </div>
        ))}
      </div>
      {hover && (
        <div className="absolute -top-8 left-0 bg-panel2 border border-line rounded px-2 py-1 text-xs whitespace-nowrap z-10">
          <span className="text-text font-medium">{hover.count}</span>{" "}
          <span className="text-muted">{label} · {hover.id}</span>
        </div>
      )}
    </div>
  );
}
