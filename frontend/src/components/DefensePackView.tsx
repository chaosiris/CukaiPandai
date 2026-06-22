import type { DefensePack } from "../lib/types";

export function DefensePackView({ pack }: { pack: DefensePack }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Contested item</p>
        <h3 className="display mt-1 text-2xl font-bold">{pack.items[0]?.contested_item}</h3>
      </div>

      <ul className="space-y-3">
        {pack.citations.map((c, i) => (
          <li key={i} className="rounded-xl border border-line bg-panel-raised p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {c.clause_ids.map((id) => (
                  <span key={id} className="chip">
                    {id}
                  </span>
                ))}
              </div>
              {c.verified ? (
                <span
                  className="chip"
                  style={{ color: "var(--ok)", borderColor: "var(--ok)" }}
                >
                  ✓ Verified
                </span>
              ) : (
                <span
                  className="chip"
                  style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                >
                  ✕ Unverified — blocked
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">{c.claim}</p>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-line p-4">
        <p className="eyebrow">Penalty exposure</p>
        <p className="mt-2 text-sm italic leading-relaxed text-muted">{pack.exposure_note}</p>
      </div>
    </div>
  );
}
