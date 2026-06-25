import './Privacy.css'

export function Privacy() {
  return (
    <section className="window privacy-window" aria-labelledby="privacy-title">
      <div className="titlebar">
        <span className="closebox" aria-hidden="true" />
        <span className="titlebar-title">Privacy (PDPA)</span>
        <span className="titlebar-meta">PDPA</span>
      </div>
      <div className="privacy-document">
        <header className="privacy-header">
          <p className="privacy-kicker">CukaiPandai</p>
          <h1 id="privacy-title">Privacy Policy</h1>
          <p>
            This notice explains how CukaiPandai handles personal data in line with Malaysia's Personal Data Protection
            Act 2010 (PDPA). It covers what we collect, how we use it, and the choices available to users of this
            decision-support tool.
          </p>
        </header>

        <section className="privacy-section" aria-labelledby="privacy-sovereign">
          <h2 id="privacy-sovereign">Sovereign Inference</h2>
          <p>
            All AI inference in CukaiPandai runs on ILMU nemo-super, a sovereign Malaysian model. No data is sent
            outside Malaysia for inference. This is a design commitment, not a configuration option.
          </p>
          <p>
            Demo data used in this prototype is fixture-only: no real taxpayer data, TIN numbers, or financial records
            are processed or stored.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="privacy-collect">
          <h2 id="privacy-collect">What We Collect</h2>
          <p>
            In a production deployment, CukaiPandai would process entity identifiers (TIN, MSIC code), financial figures
            from trial balances, obligation dates, and account details necessary to provide the service.
          </p>
          <p>
            This prototype operates entirely on fixture data. No personal or commercial tax data you enter is persisted
            beyond your browser session.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="privacy-use">
          <h2 id="privacy-use">How We Use It</h2>
          <p>
            Data would be used to derive obligation calendars, classify trial balance line items against YA2026 rules,
            produce cited Form C computations, and generate audit-defense packs grounded in the verified ITA 1967
            corpus.
          </p>
          <p>
            CukaiPandai is decision-support, not legal advice. Every output is a draft for human review. No figure is
            finalised without user approval.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="privacy-citations">
          <h2 id="privacy-citations">Citation Gate</h2>
          <p>
            Every tax figure, rate, and deadline is cited to a verified YA2026 source. The citation verifier
            deterministically rejects any clause ID not present in the verified corpus. Fabricated references are
            blocked before they reach any output.
          </p>
          <p>
            This deterministic gate means the system's integrity is auditable, not probabilistic. Users can inspect
            every rule_id and config_version that produced a figure.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="privacy-sharing">
          <h2 id="privacy-sharing">Disclosure</h2>
          <p>
            In a real deployment, information may be shared with authorised workspace members, infrastructure providers,
            and professional advisers where required to operate the service or comply with Malaysian law.
          </p>
          <p>
            No data is sold or used for unrelated advertising. All processors operate under written instructions and
            confidentiality obligations appropriate for tax and financial data.
          </p>
        </section>

        <section className="privacy-section" aria-labelledby="privacy-rights">
          <h2 id="privacy-rights">Your PDPA Rights</h2>
          <p>
            Under the Personal Data Protection Act 2010, individuals may request access to personal data held about
            them, request corrections, withdraw consent where consent is the processing basis, and raise questions about
            data use.
          </p>
          <p>
            For any production deployment, requests should be directed to the organisation operating the workspace.
            CukaiPandai would assist that organisation in locating records and responding within the required timeframe.
          </p>
        </section>

        <section className="privacy-section privacy-contact" aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">Contact</h2>
          <p>
            Privacy contact: <a href="mailto:privacy@cukaipandai.example">privacy@cukaipandai.example</a>
          </p>
          <p className="privacy-note">Last updated: 25 June 2026.</p>
        </section>
      </div>
    </section>
  )
}
