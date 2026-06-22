"use client";

import { useId, useState } from "react";

export function Toggle({
  label,
  defaultOn = false,
  hint,
  disabled = false,
}: {
  label: string;
  defaultOn?: boolean;
  hint?: string;
  disabled?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="text-sm">
        <span className="text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted">{hint}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOn((v) => !v)}
        className="relative h-6 w-11 shrink-0 rounded-full border border-line-strong transition-colors disabled:opacity-50"
        style={{ background: on ? "var(--accent)" : "var(--panel-raised)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-paper transition-all"
          style={{ left: on ? "calc(100% - 1.25rem)" : "0.125rem" }}
        />
      </button>
    </div>
  );
}
