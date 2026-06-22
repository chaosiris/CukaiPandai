"use client";

import { useMemo, useState } from "react";
import type { FaqItem } from "../lib/faq";
import { FAQ_CATEGORIES } from "../lib/faq";

export function FaqList({ items }: { items: FaqItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const inCat = category === "All" || it.category === category;
      const inQuery = !q || `${it.q} ${it.a}`.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [items, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="field font-mono text-sm"
          placeholder="Search questions and answers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search FAQ"
        />
        <select
          className="field font-mono text-sm sm:max-w-56"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All categories</option>
          {FAQ_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <ul className="mt-5 space-y-2.5">
        {filtered.map((it, i) => {
          const open = openId === it.id;
          return (
            <li key={it.id} className="overflow-hidden rounded-xl border border-line bg-panel-raised">
              <button
                type="button"
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : it.id)}
              >
                <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="display flex-1 text-lg font-semibold text-ink">{it.q}</span>
                <span className="font-mono text-lg text-muted">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="border-t border-line px-4 py-4">
                  <span className="chip mb-3 inline-block">{it.category}</span>
                  <p className="text-sm leading-relaxed text-muted">{it.a}</p>
                </div>
              )}
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-line px-4 py-6 text-center font-mono text-sm text-muted">
            No matching questions.
          </li>
        )}
      </ul>
    </div>
  );
}
