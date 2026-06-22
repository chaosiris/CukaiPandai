import Link from "next/link";
import { PageHeader } from "../../components/PageHeader";
import { WindowGlyph } from "../../components/WindowGlyph";

type Tier = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Pilot",
    price: "Free",
    cadence: "explore in mock mode",
    blurb: "Run the full demo flow on the seeded entity — no backend, no card.",
    features: [
      "1 entity · seeded Acme demo",
      "Obligation radar + cited Form C",
      "Audit-defense preview",
      "Community support",
    ],
    cta: "Open the consoles",
    href: "/obligations",
  },
  {
    name: "Tax-Agent Firm",
    price: "RM200–800",
    cadence: "per firm / month + per client",
    blurb: "One platform across many client entities — the channel multiplier.",
    features: [
      "Unlimited entities",
      "Audit-defense module",
      "Evidence vault + audit trail",
      "Citation verifier + approvals",
      "Priority support",
    ],
    cta: "Talk to us",
    href: "/audit-defense",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "RM1,500–4,000",
    cadence: "per month",
    blurb: "For group finance teams and regulated buyers needing data residency.",
    features: [
      "Everything in Tax-Agent Firm",
      "Sovereign mode (ILMU, PDPA)",
      "SSO + role-based access",
      "Custom integrations (CTOS, MyInvois)",
      "SLA + onboarding",
    ],
    cta: "Contact sales",
    href: "/audit-defense",
  },
];

export default function PricingPage() {
  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center">
          <p className="eyebrow">Plans</p>
          <h1 className="display mx-auto mt-3 max-w-2xl text-4xl font-bold sm:text-5xl">
            Start Free. Scale When Your Team Does.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
            Land on the audit-defense pain, expand into the whole compliance calendar. Sovereign mode
            unlocks regulated and GLC buyers.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <section
              key={t.name}
              className="window flex h-full flex-col"
              style={t.featured ? { borderColor: "var(--accent)", borderWidth: 2 } : undefined}
            >
              <div className="window__bar">
                <span className="flex items-center gap-2 text-ink">
                  <WindowGlyph /> {t.name}
                </span>
                {t.featured ? (
                  <span className="chip" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>
                    Popular
                  </span>
                ) : (
                  <span className="text-muted">plan</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="display text-3xl font-bold text-ink">{t.price}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-muted">{t.cadence}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{t.blurb}</p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <span className="mt-0.5 text-accent" aria-hidden="true">
                        ✓
                      </span>
                      <span className="text-ink">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-2">
                  <Link
                    href={t.href}
                    className={`btn block w-full text-center ${t.featured ? "btn--primary" : "btn--ghost"}`}
                  >
                    {t.cta}
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-center font-mono text-xs uppercase tracking-widest text-muted">
          Indicative pricing · per-audit-defense premium available
        </p>
      </div>
    </main>
  );
}
