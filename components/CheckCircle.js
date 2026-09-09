"use client";

// A circular checkbox. Click toggles completion — always stopPropagation so
// it can sit inside a clickable row/Link without triggering navigation.
export default function CheckCircle({ checked, onToggle, size = 20, title }) {
  return (
    <button
      type="button"
      title={title || (checked ? "Mark as not done" : "Mark as done")}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(!checked);
      }}
      style={{ width: size, height: size }}
      className={`flex-shrink-0 rounded-full border flex items-center justify-center transition-colors ${
        checked
          ? "bg-leaf border-leaf text-ink"
          : "bg-transparent border-line hover:border-leaf text-transparent"
      }`}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12.5L9.5 18L20 6"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
