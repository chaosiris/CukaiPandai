"use client";

import { useEffect, useState } from "react";
import { ObligationTable } from "../../components/ObligationTable";
import { Panel } from "../../components/Panel";
import { PageHeader } from "../../components/PageHeader";
import { getObligations } from "../../lib/api";
import { ACME_TIN, acmeSsm } from "../../lib/fixtures";
import type { ObligationCalendar } from "../../lib/types";

export default function ObligationsPage() {
  const [cal, setCal] = useState<ObligationCalendar | null>(null);

  useEffect(() => {
    getObligations(ACME_TIN, acmeSsm).then(setCal).catch(() => setCal(null));
  }, []);

  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <PageHeader title="Obligations" eyebrow="What this entity must file · derived, not guessed" />

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Panel title="Obligation Radar" label={`tin ${ACME_TIN}`}>
            {cal ? (
              <ObligationTable calendar={cal} />
            ) : (
              <p className="font-mono text-sm text-muted">Deriving obligations…</p>
            )}
          </Panel>

          <Panel title="How this is derived" label="proof">
            <p className="text-sm leading-relaxed text-muted">
              There is no government API that returns a company&apos;s obligations. CukaiPandai
              assembles an Entity Tax Profile from <b className="text-ink">SSM</b> (entity type, MSIC,
              paid-up capital), <b className="text-ink">MyInvois</b> (turnover) and{" "}
              <b className="text-ink">MySST</b>, then runs a deterministic rules engine keyed to the
              Year of Assessment.
            </p>
            <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">
              Every deadline carries its rule id.
            </p>
          </Panel>
        </div>
      </div>
    </main>
  );
}
