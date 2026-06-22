"use client";

import { useState } from "react";
import { DefensePackView } from "../../components/DefensePackView";
import { Panel } from "../../components/Panel";
import { PageHeader } from "../../components/PageHeader";
import { auditDefense } from "../../lib/api";
import { ACME_TIN } from "../../lib/fixtures";
import type { DefensePack } from "../../lib/types";

const DEMO_QUERY = "Justify your RM4,800 repairs deduction";
const EVIDENCE = [["tax_payable", "trial_balance_acme", "ITA-1967-s33(1)"]];

export default function AuditDefensePage() {
  const [query, setQuery] = useState(DEMO_QUERY);
  const [pack, setPack] = useState<DefensePack | null>(null);
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      setPack(await auditDefense(ACME_TIN, query, EVIDENCE));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <PageHeader title="Audit-Defense" eyebrow="Paste an LHDN query · get a cited defense pack" />

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Panel title="Auditor query" label="the hero">
            <textarea
              className="field min-h-28 font-mono text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="LHDN auditor query"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn--primary" onClick={build} disabled={busy}>
                {busy ? "Building…" : "Build defense pack"}
              </button>
              <span className="font-mono text-xs text-muted">
                Tip: include “fake” to watch the citation gate reject an unsupported clause.
              </span>
            </div>

            {pack && (
              <div className="mt-6 border-t border-line pt-6">
                <DefensePackView pack={pack} />
              </div>
            )}
          </Panel>

          <Panel title="Contract note" label="proof">
            <p className="text-sm leading-relaxed text-muted">
              Every score links to a backend-verified line from the evidence. If a claim has no
              clause that exists in the law corpus, no proof is shown — the defense is only as strong
              as the law that backs it.
            </p>
            <p className="display mt-5 text-lg italic text-accent">Every score has a receipt.</p>
          </Panel>
        </div>
      </div>
    </main>
  );
}
