"use client";

// Small horizontal progress bar: `completed` out of `total`.
// Pass `compact` for a thin inline version (topic rows), omit it for the
// larger version used on the topics list header / dashboard.
export default function ProgressBar({ completed = 0, total = 0, compact = false, accent = "#4FD1C5" }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${compact ? "min-w-[110px]" : "w-full"}`}>
      <div
        className={`flex-1 ${compact ? "h-1.5" : "h-2.5"} rounded-full bg-panel2 border border-line overflow-hidden`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: accent }}
        />
      </div>
      <span className={`mono text-muted ${compact ? "text-[10px]" : "text-xs"} whitespace-nowrap`}>
        {completed}/{total}
      </span>
    </div>
  );
}
