"use client";

import { useState } from "react";
import { CitedComputation } from "../../components/CitedComputation";
import { Panel } from "../../components/Panel";
import { PageHeader } from "../../components/PageHeader";
import { computeFormC } from "../../lib/api";
import { ACME_TIN, acmeLineItems, acmeSsm } from "../../lib/fixtures";
import type { FormComputation } from "../../lib/types";

export default function FilingPage() {
  const [fc, setFc] = useState<FormComputation | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function compute() {
    setBusy(true);
    try {
      const r = await computeFormC(ACME_TIN, acmeSsm, acmeLineItems);
      setFc(r.computation);
      setRequiresApproval(r.requires_approval);
      setApproved(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <PageHeader title="Filing Studio" eyebrow="Form C · every figure cited to source + law" />

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Panel title="Cited Form C" label="YA2026 · Acme Sdn Bhd">
            <div className="mb-4 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-panel-raised font-mono text-xs uppercase tracking-widest text-muted">
                    <th className="px-4 py-2.5 font-medium">Code</th>
                    <th className="px-4 py-2.5 font-medium">Line item</th>
                    <th className="px-4 py-2.5 font-medium">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {acmeLineItems.map((li) => (
                    <tr key={li.code} className="border-t border-line">
                      <td className="px-4 py-2.5 font-mono text-muted">{li.code}</td>
                      <td className="px-4 py-2.5 text-ink">{li.description}</td>
                      <td className="px-4 py-2.5 font-mono text-ink">
                        RM {li.amount.toLocaleString("en-MY")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="chip">{li.category}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" className="btn btn--ghost" onClick={compute} disabled={busy}>
              {busy ? "Computing…" : fc ? "Recompute Form C" : "Compute Form C"}
            </button>

            {fc && (
              <div className="mt-6">
                <CitedComputation
                  computation={fc}
                  approved={approved}
                  onApprove={() => requiresApproval && setApproved(true)}
                />
              </div>
            )}

            {approved && (
              <p className="mt-4 rounded-xl border border-line bg-panel-raised px-4 py-3 text-sm text-ink">
                ✓ Approved — packaged for MyTax submission with its full citation trail.
              </p>
            )}
          </Panel>

          <Panel title="The guarantee" label="deterministic">
            <p className="text-sm leading-relaxed text-muted">
              The deterministic core does all tax math from versioned config — the model never
              invents a number. Each figure carries a <b className="text-ink">FigureTrace</b> (rule id
              + config version), and a human approves before anything is filed.
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
              Nothing is a black box.
            </p>
          </Panel>
        </div>
      </div>
    </main>
  );
}
