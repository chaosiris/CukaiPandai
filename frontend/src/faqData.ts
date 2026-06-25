export type FaqCategory =
  | 'Getting Started'
  | 'Sovereignty & Data'
  | 'Citations & Accuracy'
  | 'Filing & Compliance'
  | 'Privacy & Account'

export type FaqItem = {
  q: string
  a: string
  category: FaqCategory
  featured?: boolean
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  'Getting Started',
  'Sovereignty & Data',
  'Citations & Accuracy',
  'Filing & Compliance',
  'Privacy & Account'
]

export const FAQ_ITEMS: FaqItem[] = [
  // ── Getting Started ──────────────────────────────────────────────
  {
    category: 'Getting Started',
    featured: true,
    q: 'What Is CukaiPandai?',
    a: 'CukaiPandai is a citation-grounded tax-assurance tool for Malaysian SMEs. It derives your obligation calendar, helps you prepare a cited Form C, and builds audit-defense packs where every figure traces back to a verified source. It is decision support that keeps a human in the loop, not an automated filer.'
  },
  {
    category: 'Getting Started',
    q: 'How Do I Start Using the App?',
    a: 'Open the demo from the landing page, then move through the three consoles in the Workspace and Compliance nav groups: the Obligation Radar for deadlines, the Filing Studio for Form C preparation, and Audit Defense for grounded answers to audit queries. Each console explains what it needs before you proceed.'
  },
  {
    category: 'Getting Started',
    q: 'Do I Need to Be a Tax Professional to Use It?',
    a: 'No. CukaiPandai is written for SME owners and their finance staff. It surfaces the rule behind every figure in plain language, so you can understand what drives a result. For anything binding, we still recommend reviewing the output with a licensed tax agent.'
  },
  {
    category: 'Getting Started',
    q: 'What Are the Three Consoles?',
    a: 'Obligation Radar shows your upcoming filing deadlines derived from your entity profile. Filing Studio classifies trial-balance line items and assembles a cited Form C. Audit Defense retrieves relevant clauses and answers audit-style questions with verified citations. They share the same deterministic core.'
  },

  // ── Sovereignty & Data ───────────────────────────────────────────
  {
    category: 'Sovereignty & Data',
    featured: true,
    q: 'Where Does the AI Inference Run?',
    a: 'CukaiPandai is routed ILMU-first, using the sovereign nemo-super model for in-country inference. The goal is that your tax data is reasoned over within Malaysia rather than being sent abroad by default. A second model can be used as failover or escalation when the primary is unavailable.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'What Does Sovereign Inference Mean Here?',
    a: 'It means the primary model that reads your data is hosted in-country, so sensitive financial figures are processed under Malaysian jurisdiction. Sovereignty is about where and under whose control the inference happens, which matters for organisations that must keep tax data local.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'What Is ILMU nemo-super?',
    a: 'It is the sovereign Malaysian model CukaiPandai routes to first for its language reasoning. The application orchestrates this model but never lets it invent tax figures or law; the numbers and legal references always come from the deterministic core, not from the model.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'Does the Model Make the Tax Calculations?',
    a: 'No. The deterministic core owns all tax math, deadlines, and law lookups. The model layer orchestrates the workflow and explains results in plain language, but the authoritative numbers come from the core. This separation is deliberate so figures stay reproducible.'
  },

  // ── Citations & Accuracy ─────────────────────────────────────────
  {
    category: 'Citations & Accuracy',
    featured: true,
    q: 'How Does the Citation Gate Work?',
    a: 'Before any clause reference is shown, a deterministic verifier checks it against the verified corpus. If a clause ID is not present in that corpus, the citation is rejected at the gate rather than displayed. The check is rule-based, not probabilistic, so fabricated references are blocked.'
  },
  {
    category: 'Citations & Accuracy',
    featured: true,
    q: 'Can the AI Make Up a Tax Figure or Law?',
    a: 'The system is built specifically to prevent that. Tax figures come from the deterministic core, and legal references are validated against the verified corpus before they reach you. A reference the verifier cannot confirm is rejected instead of being passed through as if it were real.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'What Does "Every Figure Is Cited" Mean?',
    a: 'Each computed line in your filing carries the rule it came from and the configuration version that produced it. That lets you trace a number back to its source and reproduce it, rather than trusting an unexplained total.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'What Year Are the Figures Based On?',
    a: 'Rates, thresholds, and deadlines are sourced for the YA2026 assessment year and cited to their source. We do not publish invented rates in this FAQ; you will see the specific figures and their citations inside the consoles when you run your own data.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'What Happens if a Source Cannot Be Verified?',
    a: 'It is rejected. The design favours showing nothing over showing an unverifiable claim, because in a tax context a confident but wrong citation is worse than an honest gap. Rejected references are surfaced so you know the gate acted.'
  },

  // ── Filing & Compliance ──────────────────────────────────────────
  {
    category: 'Filing & Compliance',
    featured: true,
    q: 'Does CukaiPandai File Form C for Me Automatically?',
    a: 'No. It prepares a cited Form C and pauses for your approval at a human-in-the-loop gate before anything is treated as final. You review the figures and their citations, and you remain the person who decides to proceed. It is decision support, not an auto-filer.'
  },
  {
    category: 'Filing & Compliance',
    q: 'Is This Legal or Tax Advice?',
    a: 'No. CukaiPandai is decision support, not legal or tax advice, and it does not replace a licensed tax agent. Use it to understand your position and prepare your figures, then have a qualified professional review anything you intend to submit.'
  },
  {
    category: 'Filing & Compliance',
    q: 'How Are My Filing Deadlines Determined?',
    a: 'The Obligation Radar derives your calendar from your entity profile and the applicable filing rules, then lists the obligations that apply to you with their due dates. Because it is derived rather than hand-entered, it is easier to keep consistent as your profile changes.'
  },
  {
    category: 'Filing & Compliance',
    q: 'What Is the Human Approval Gate?',
    a: 'The filing workflow deliberately interrupts itself and waits for you to approve before finalising. This keeps a person accountable for the submission and gives you a checkpoint to inspect every cited figure before committing to it.'
  },
  {
    category: 'Filing & Compliance',
    q: 'Is the Demo Using Real Company Data?',
    a: 'No. The demo runs on seeded fixtures for sample entities so you can explore the full flow without exposing real records. It is meant to show how the consoles behave, not to file on behalf of an actual company.'
  },

  // ── Privacy & Account ────────────────────────────────────────────
  {
    category: 'Privacy & Account',
    q: 'How Is My Data Handled?',
    a: 'The product is designed to keep sensitive tax data processed in-country via sovereign inference, and to apply data-protection practices in line with Malaysian privacy expectations. In the fixtures-based demo, you are working with seeded sample data rather than live records.'
  },
  {
    category: 'Privacy & Account',
    q: 'Can I Switch Between Entities?',
    a: 'Yes. The entity switcher in the top bar lets you change the active entity, and the consoles update to reflect that entity profile. In the demo this moves you between the seeded sample companies.'
  },
  {
    category: 'Privacy & Account',
    q: 'How Do I Sign Out?',
    a: 'Open the profile menu in the top bar and choose Sign Out. In the demo this clears your local guest session and returns you to the landing page. No filing is submitted simply by signing in or out.'
  }
]
