"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ENTITY_STATUSES } from "../lib/entities";
import type { EntityStatus, EntitySummary } from "../lib/entities";
import { WindowGlyph } from "./WindowGlyph";

const STATUS_TONE: Record<EntityStatus, string> = {
  "In Review": "var(--warn)",
  Filed: "var(--ok)",
  Draft: "var(--muted)",
};

type Filter = "All" | EntityStatus;

export function EntitiesGrid({ entities }: { entities: EntitySummary[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entities.filter((e) => {
      const inStatus = status === "All" || e.status === status;
      const inQuery = !q || e.name.toLowerCase().includes(q);
      return inStatus && inQuery;
    });
  }, [entities, query, status]);

  const chips: Filter[] = ["All", ...ENTITY_STATUSES];

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          className="field font-mono text-sm"
          placeholder="Search entities by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search entities"
        />
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => {
            const active = status === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(c)}
                className="chip"
                style={active ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <section
            key={e.tin}
            className="window flex h-full flex-col"
            style={e.live ? { borderColor: "var(--accent)" } : undefined}
          >
            <div className="window__bar">
              <span className="flex items-center gap-2 text-ink">
                <WindowGlyph /> {e.name}
              </span>
              <span
                className="font-mono text-xs uppercase tracking-wider"
                style={{ color: STATUS_TONE[e.status] }}
              >
                {e.status}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <Field k="TIN" v={e.tin} mono />
                <Field k="Type" v={e.entityType} />
                <Field k="Region" v={e.region} />
                <Field k="Obligations" v={String(e.obligations)} mono />
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <span className="chip" style={e.live ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}>
                  {e.live ? "live" : "demo"}
                </span>
                <Link
                  href="/obligations"
                  aria-label={`Open ${e.name}`}
                  className="font-mono text-xs uppercase tracking-widest text-accent hover:underline"
                >
                  Open <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </section>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-line px-4 py-6 text-center font-mono text-sm text-muted md:col-span-2 lg:col-span-3">
            No matching entities.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <dt className="eyebrow">{k}</dt>
      <dd className={`mt-0.5 text-ink ${mono ? "font-mono text-xs" : ""}`}>{v}</dd>
    </div>
  );
}
