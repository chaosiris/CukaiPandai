import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

type Step = {
  num: string
  label: string
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    num: '01',
    label: 'Obligations',
    title: 'Know Every Deadline, Derived from Your Profile',
    body: 'Drop your entity TIN and MSIC code. CukaiPandai derives your YA2026 obligation calendar from LHDN rules: Form C, CP204, SST filing. No guesswork.'
  },
  {
    num: '02',
    label: 'Filing',
    title: 'Cite Every Figure, Every Time',
    body: 'Paste your raw trial balance. The AI classifies line items, computes Form C, and traces every number to its ITA 1967 rule_id and config_version. You approve before anything is finalised.'
  },
  {
    num: '03',
    label: 'Audit Defense',
    title: 'Build a Defensible Pack, Instantly',
    body: 'Ask any audit query. The system retrieves relevant ITA clauses, grounds each citation against the corpus, and rejects any clause ID it cannot verify. Fabrications are blocked at the gate.'
  }
]

const TRUST_ROWS = [
  {
    tag: 'Sovereign inference',
    detail:
      'Every AI call runs on ILMU nemo-super, an in-country Malaysian model. No data leaves Malaysia for inference.'
  },
  {
    tag: 'Deterministic citation gate',
    detail:
      'ground_citation rejects any clause ID not in the verified YA2026 corpus. The gate is deterministic, not probabilistic.'
  },
  {
    tag: 'Decision support',
    detail: 'CukaiPandai is decision-support, not legal advice. A human reviews before any filing is submitted.'
  },
  {
    tag: 'YA2026-sourced',
    detail:
      'All rates, thresholds, and deadlines are cited to LHDN and the Income Tax Act 1967. No figures are invented.'
  }
]

function StepMock({ num }: { num: string }) {
  if (num === '01') {
    return (
      <ul className="lp-mock-obligations">
        {[
          { form: 'Form C', type: 'CORPORATE INCOME TAX', date: '30 Apr 2027', status: 'upcoming' },
          { form: 'CP204', type: 'INSTALMENT Q1', date: '30 Jul 2026', status: 'urgent' },
          { form: 'CP204', type: 'INSTALMENT Q2', date: '30 Sep 2026', status: 'upcoming' }
        ].map((ob) => (
          <li key={ob.type}>
            <span className="lp-ob-badge">{ob.form}</span>
            <span className="lp-ob-type">{ob.type}</span>
            <span className={`lp-ob-date lp-ob-date-${ob.status}`}>{ob.date}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (num === '02') {
    return (
      <div className="lp-mock-filing">
        <div className="lp-filing-row">
          <span>Gross Income</span>
          <strong>RM 5,000,000</strong>
          <span className="lp-filing-rule">s.4(a) · ITA_s4</span>
        </div>
        <div className="lp-filing-row">
          <span>Adjusted Income</span>
          <strong>RM 4,850,200</strong>
          <span className="lp-filing-rule">s.33 · ITA_s33</span>
        </div>
        <div className="lp-filing-row lp-filing-row-hero">
          <span>Tax Payable</span>
          <strong>RM 31,000</strong>
          <span className="lp-filing-rule lp-verified-badge">Verified</span>
        </div>
      </div>
    )
  }
  return (
    <div className="lp-mock-defense">
      <div className="lp-defense-query">
        <span className="lp-defense-label">Query</span>
        <p>Justify your RM 4,800 repairs deduction</p>
      </div>
      <div className="lp-defense-citation">
        <span className="lp-defense-label">Citation</span>
        <p>ITA_s33_1 · s.33(1): deduction for expenses incurred in producing income</p>
        <span className="lp-verified-badge">Verified</span>
      </div>
      <div className="lp-defense-rejected">
        <span className="lp-defense-label">Fabricated ID blocked</span>
        <span className="lp-rejected-badge">ITA_s99_ZZ: Rejected</span>
      </div>
    </div>
  )
}

export function Landing() {
  const [activeStep, setActiveStep] = useState(0)
  const [showTop, setShowTop] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const onScroll = () => {
      const trigger = window.innerHeight * 0.5
      let idx = 0
      cardRefs.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= trigger) idx = i
      })
      setActiveStep(idx)
      setShowTop(window.scrollY > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="lp">
      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow">AI Tax Assurance for Malaysian SMEs</p>
            <h1 className="lp-hero-title">
              Every Tax Figure, <em>Cited and Verified.</em>
            </h1>
            <p className="lp-hero-sub">
              CukaiPandai derives your YA2026 obligation calendar, files Form C with every figure traced to ITA 1967,
              and builds audit-defense packs where every citation is verified against the law corpus. Nothing is
              hallucinated.
            </p>
            <Link className="lp-hero-cta" to="/sign-in">
              Get Started
            </Link>
          </div>
        </div>
        <a className="lp-scroll-cue" href="#how" aria-label="Scroll to how it works">
          ▼
        </a>
      </section>

      <div className="lp-fold">
        {/* How it works */}
        <section className="lp-section lp-how" id="how">
          <div className="lp-inner lp-how-grid">
            <div className="lp-how-left">
              <p className="lp-kicker">How It Works</p>
              <h2 className="lp-h2 lp-how-h2">Three Consoles. One Sovereign Stack.</h2>
              <ol className="lp-steps">
                {STEPS.map((step, i) => (
                  <li key={step.num} className={`lp-step${i === activeStep ? ' is-active' : ''}`}>
                    <span className="lp-step-num">{step.num}</span>
                    <div className="lp-step-text">
                      <h3 className="lp-step-title">{step.title}</h3>
                      <p className="lp-step-body">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lp-how-right">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="lp-card-slot"
                  ref={(el) => {
                    cardRefs.current[i] = el
                  }}
                >
                  <div className="window lp-mock">
                    <div className="titlebar">
                      <span className="closebox" aria-hidden="true" />
                      <span className="titlebar-title">
                        {step.num} · {step.label}
                      </span>
                    </div>
                    <div className="lp-mock-body">
                      <StepMock num={step.num} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / sovereignty section */}
        <section className="lp-section lp-trust">
          <div className="lp-inner">
            <p className="lp-kicker lp-on-dark">Sovereignty and Trust</p>
            <h2 className="lp-h2 lp-on-dark">Built for Malaysia. Verified at Every Step.</h2>
            <p className="lp-body lp-on-dark">
              CukaiPandai runs on ILMU nemo-super, a sovereign Malaysian model, with a deterministic citation gate that
              rejects any clause ID not in the verified corpus. Your data stays in-country. Every figure has a rule.
              Every rule has a source.
            </p>
            <div className="lp-trust-grid">
              {TRUST_ROWS.map((row) => (
                <div key={row.tag} className="lp-trust-card">
                  <span className="lp-trust-tag">{row.tag}</span>
                  <p>{row.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Finale CTA */}
        <section className="lp-section lp-finale">
          <div className="lp-inner lp-finale-inner">
            <p className="lp-script">every figure has a citation.</p>
            <Link className="lp-finale-cta" to="/sign-in">
              Open the Demo
            </Link>
          </div>
        </section>
      </div>

      <button
        type="button"
        className={`lp-top${showTop ? ' is-visible' : ''}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ▲
      </button>
    </div>
  )
}
