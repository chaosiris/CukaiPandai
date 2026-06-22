"use client";

import { useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { Toggle } from "../../components/Toggle";

function Label({ children }: { children: string }) {
  return <span className="eyebrow mb-1.5 block">{children}</span>;
}

export default function SettingsPage() {
  const [riskSensitivity, setRiskSensitivity] = useState(60);
  const [mismatchThreshold, setMismatchThreshold] = useState(10);

  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-5xl px-5 py-14">
        <PageHeader title="Settings" eyebrow="Workspace preferences" />

        <div className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Account" label="profile">
              <p className="mb-4 rounded-lg border border-line bg-panel-raised px-3 py-2 font-mono text-xs text-muted">
                Signed in as <b className="text-ink">Guest</b> · exploring with full access
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Display name</Label>
                  <input className="field" placeholder="Guest" />
                </div>
                <div>
                  <Label>Email</Label>
                  <input className="field" placeholder="you@company.com" type="email" />
                </div>
                <div>
                  <Label>Role</Label>
                  <select className="field" defaultValue="Tax Agent">
                    <option>Tax Agent (s.153)</option>
                    <option>Group Tax Manager</option>
                    <option>Financial Controller</option>
                  </select>
                </div>
              </div>
            </Panel>

            <Panel title="Workspace" label="organisation">
              <div className="space-y-4">
                <div>
                  <Label>Workspace name</Label>
                  <input className="field" placeholder="Your firm or group" />
                </div>
                <div>
                  <Label>Region</Label>
                  <select className="field" defaultValue="Malaysia">
                    <option>Malaysia</option>
                    <option>Singapore</option>
                  </select>
                </div>
                <div>
                  <Label>Year of Assessment</Label>
                  <select className="field" defaultValue="2026">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
              </div>
            </Panel>
          </div>

          <Panel title="Filing & Risk Engine" label="deterministic core">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Audit-risk sensitivity</Label>
                  <span className="font-mono text-sm text-ink">{riskSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={riskSensitivity}
                  onChange={(e) => setRiskSensitivity(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--accent)" }}
                  aria-label="Audit-risk sensitivity"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Turnover-mismatch threshold</Label>
                  <span className="font-mono text-sm text-ink">{mismatchThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={mismatchThreshold}
                  onChange={(e) => setMismatchThreshold(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--accent)" }}
                  aria-label="Turnover-mismatch threshold"
                />
              </div>
            </div>
            <p className="mt-4 font-mono text-xs text-muted">
              Tax rates, bands and deadlines are versioned config — config version{" "}
              <b className="text-ink">YA2026.1</b>. These knobs only tune flagging, never the math.
            </p>
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel title="Proof & Citations" label="integrity">
              <Toggle
                label="Require verified citations before filing"
                hint="Blocks any figure whose clause is absent from the law corpus."
                defaultOn
                disabled
              />
              <Toggle
                label="Run the LLM citation critic"
                hint="Second check on top of the deterministic gate."
                defaultOn
              />
            </Panel>

            <Panel title="Notifications" label="alerts">
              <Toggle label="Deadline reminders" hint="Form C, CP204, SST, e-invoice." defaultOn />
              <Toggle label="Audit-risk alerts" hint="When a flag is raised before filing." defaultOn />
              <Toggle label="Approval requests" hint="When a human sign-off is pending." />
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
