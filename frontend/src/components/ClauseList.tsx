"use client";

import { useMemo, useState } from "react";
import type { Clause } from "../lib/corpus";
import { CLAUSE_CATEGORIES } from "../lib/corpus";

export function ClauseList({ clauses }: { clauses: Clause[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clauses.filter((c) => {
      const inCat = category === "All" || c.category === category;
      const inQuery =
        !q || `${c.clause_id} ${c.source} ${c.category} ${c.text}`.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [clauses, query, category]);

  const chips = ["All", ...CLAUSE_CATEGORIES];

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          className="field font-mono text-sm"
          placeholder="Search clauses, sources or text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search law corpus"
        />
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className="chip"
                style={active ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {filtered.map((c) => (
          <li key={c.clause_id} className="rounded-xl border border-line bg-panel-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="chip" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
                {c.clause_id}
              </span>
              <span className="chip">{c.category}</span>
            </div>
            <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted">{c.source}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink">{c.text}</p>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-line px-4 py-6 text-center font-mono text-sm text-muted">
            No matching clauses.
          </li>
        )}
      </ul>
    </div>
  );
}
