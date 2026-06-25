export default function About() {
  return (
    <>
      <header className="page-head">
        <div>
          <h1>About</h1>
          <div className="page-kicker">CukaiPandai · YA2026 Tax Assurance for Malaysian SMEs</div>
        </div>
      </header>

      {/* Problem */}
      <section className="window" style={{ marginBottom: 20 }} aria-labelledby="problem-title">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title" id="problem-title">
            The Problem
          </span>
          <span className="titlebar-meta">why this exists</span>
        </div>
        <div style={{ padding: '18px 20px', display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--ink)'
              }}
            >
              No Single Source of Truth for Obligations
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
              Malaysian SMEs must track multiple YA2026 obligations (Form C, CP204, MyInvois, SST-02, CP39) across
              different agencies. There is no single system that derives a company's exact obligation set from its
              profile, leaving owners to cross-reference legislation, LHDN guides, and SST circulars manually.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--ink)'
              }}
            >
              Untraceable Figures in Tax Filing
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
              Form C filing is error-prone. When a figure appears on a return, the SME owner cannot easily trace it to a
              specific provision of the Income Tax Act 1967. Discrepancies under audit are hard to explain without clear
              legislative backing.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--ink)'
              }}
            >
              Hallucinated Citations from Generic AI Tools
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
              Generic AI tools frequently fabricate ITA clause references. A fabricated citation in an audit-defense
              pack is worse than no citation at all. They also send data offshore, raising PDPA concerns for SMEs
              handling employee and financial records.
            </p>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="window" style={{ marginBottom: 20 }} aria-labelledby="objectives-title">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title" id="objectives-title">
            Objectives
          </span>
          <span className="titlebar-meta">what CukaiPandai does</span>
        </div>
        <div style={{ padding: '18px 20px', display: 'grid', gap: 14 }}>
          {[
            {
              num: '01',
              title: 'Automatic YA2026 Obligation Calendar',
              body: 'Derives every applicable deadline (Form C, CP204, MyInvois, SST-02, CP39) directly from the entity profile. No manual cross-referencing. Each obligation traces to its LHDN rule ID.'
            },
            {
              num: '02',
              title: 'Cited Form C Filing',
              body: 'Every figure on the Form C computation traces to a verified YA2026 source (rule ID + config version). A human-in-the-loop approval gate runs before any submission, so owners review computed values before they are finalised.'
            },
            {
              num: '03',
              title: 'Citation-Grounded Audit Defense',
              body: 'Build a defense pack for any contested deduction. A deterministic citation verifier rejects fabricated clause references at the gate: only passages that can be resolved to real ITA sections are included.'
            },
            {
              num: '04',
              title: 'Sovereign, In-Country Inference',
              body: 'All LLM inference runs on the ILMU gateway (sovereign Malaysian infrastructure) by default. Data stays in-country. A direct-Anthropic call is an opt-in that must be explicitly enabled.'
            }
          ].map((item) => (
            <div
              key={item.num}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 16,
                alignItems: 'start',
                paddingBottom: 14,
                borderBottom: 'var(--border)'
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--denim)',
                  lineHeight: 1
                }}
              >
                {item.num}
              </span>
              <div style={{ display: 'grid', gap: 6 }}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    fontWeight: 600,
                    color: 'var(--ink)'
                  }}
                >
                  {item.title}
                </h2>
                <p
                  style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-soft)' }}
                >
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="window" style={{ marginBottom: 20 }} aria-labelledby="how-title">
        <div className="titlebar">
          <span className="closebox" aria-hidden="true" />
          <span className="titlebar-title" id="how-title">
            How It Works
          </span>
          <span className="titlebar-meta">architecture in plain language</span>
        </div>
        <div style={{ padding: '18px 20px', display: 'grid', gap: 10 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
            A deterministic core owns all tax math, obligation derivation, and citation lookups. It does not call any
            LLM. An agentic layer (FastAPI + LangGraph) wraps the core and handles filing workflows, audit-defense
            queries, and the HITL approval interrupt. The LLM never computes a tax figure; it only assists with
            natural-language explanations and search, always with the citation verifier as a gate.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
            Every figure that reaches the Form C output carries a{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>rule_id</span> and{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>config_version</span> linking it to the
            YA2026 configuration. Citations in the audit-defense pack carry the ITA section, page reference, and a
            passage excerpt; the verifier rejects any citation that cannot be resolved.
          </p>
          <p
            style={{
              marginTop: 6,
              padding: '10px 14px',
              border: '1px solid var(--denim)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--denim)',
              letterSpacing: '0.04em'
            }}
          >
            Decision support, not legal advice. Consult a licensed tax agent for your specific circumstances.
          </p>
        </div>
      </section>
    </>
  )
}
