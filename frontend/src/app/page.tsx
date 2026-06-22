import Link from "next/link";
import { Panel } from "../components/Panel";
import { WindowGlyph } from "../components/WindowGlyph";

const FEATURES = [
  {
    title: "Obligation Radar",
    label: "derive",
    body: "No government API tells you what a company owes. We derive it from SSM, MyInvois and SST into a deadline calendar.",
    href: "/obligations",
  },
  {
    title: "Cited Filing Studio",
    label: "prepare",
    body: "Form C computed on a deterministic engine — every figure traces to its source line and the exact Income Tax Act clause.",
    href: "/filing",
  },
  {
    title: "Audit-Defense Agent",
    label: "defend",
    body: "Paste an LHDN query; get a cited defense pack and penalty exposure in seconds. The hero of the demo.",
    href: "/audit-defense",
  },
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="eyebrow">Audit-Defense Tax Assurance</p>
          <h1 className="display mt-5 text-5xl font-bold sm:text-6xl">
            The Tax Filing That{" "}
            <span className="block italic text-accent">Shows Its Receipts.</span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
            CukaiPandai reads your books for what the tax return actually needs, then backs every
            figure with the exact source line and Income Tax Act clause it came from. Verified by the
            backend. Never hallucinated.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/obligations" className="btn btn--primary">
              Open the consoles
            </Link>
            <Link href="/audit-defense" className="btn btn--ghost">
              See audit-defense →
            </Link>
          </div>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted">
            Deterministic core · cited outputs · human-approved · sovereign-ready
          </p>
        </div>

        {/* Retro window illustration — a cited Form C with a verified badge */}
        <div className="relative">
          <div className="window mx-auto max-w-md rotate-1">
            <div className="window__bar">
              <span className="flex items-center gap-2 text-ink">
                <WindowGlyph /> Form C · Acme Sdn Bhd
              </span>
              <span className="text-muted">YA2026</span>
            </div>
            <div className="space-y-3 p-5">
              <Row k="Chargeable income" v="RM 200,000" cite="cit.chargeable_income" />
              <Row k="Tax payable" v="RM 31,000" cite="cit.rate.sme" highlight />
              <Row k="Repairs (deductible)" v="RM 4,800" cite="ITA-1967-s33(1)" />
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-panel-raised px-4 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-accent-ink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm">
                  <b className="text-ink">Backend-verified.</b>{" "}
                  <span className="text-muted">Every figure links to a clause that exists.</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="paper-grid border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="eyebrow text-center">What it does</p>
          <h2 className="display mt-3 text-center text-3xl font-bold sm:text-4xl">
            Four jobs, one audit trail.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className="block transition-transform hover:-translate-y-1">
                <Panel title={f.title} label={f.label} className="h-full">
                  <p className="text-sm leading-relaxed text-muted">{f.body}</p>
                  <p className="mt-4 font-mono text-xs uppercase tracking-widest text-accent">Open →</p>
                </Panel>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="display mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">
          Rank the risk. Cite the law. Defend the filing.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
          Built for Malaysian tax agents and enterprise finance teams — land on the audit-defense
          pain, expand into the whole compliance calendar.
        </p>
        <div className="mt-8">
          <Link href="/filing" className="btn btn--primary">
            Try the Filing Studio
          </Link>
        </div>
      </section>
    </main>
  );
}

function Row({
  k,
  v,
  cite,
  highlight = false,
}: {
  k: string;
  v: string;
  cite: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5"
      style={highlight ? { background: "color-mix(in srgb, var(--accent) 12%, transparent)" } : undefined}
    >
      <span className="text-sm text-muted">{k}</span>
      <span className="flex items-baseline gap-2">
        <span className={`font-mono text-sm ${highlight ? "font-bold text-ink" : "text-ink"}`}>{v}</span>
        <span className="chip">{cite}</span>
      </span>
    </div>
  );
}
