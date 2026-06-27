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
  // Getting Started
  {
    category: 'Getting Started',
    featured: true,
    q: 'What Is CukaiPandai?',
    a: 'CukaiPandai is a citation-grounded tax-assurance tool for Malaysian SMEs. It derives your YA2026 obligations, prepares a cited Form C with computed tax payable, and lets you ask Pandai about any figure on the filing. It is decision support, not legal advice or an automated filer.'
  },
  {
    category: 'Getting Started',
    featured: true,
    q: 'What Are the Three Consoles?',
    a: 'Obligations shows the YA2026 deadline calendar derived from the entity profile. Filing turns uploaded or structured line items into a cited Form C with computed tax payable. Audit Assistant lets you ask Pandai about a saved filing and get a citation-grounded answer.'
  },
  {
    category: 'Getting Started',
    q: 'How Do I Start Using the App?',
    a: 'Open the demo, choose a seeded Malaysian SME such as Acme Trading, then use Obligations, Filing, and Audit Assistant in sequence. The demo data is fixture data, so you can explore the full flow without exposing a real taxpayer record.'
  },
  {
    category: 'Getting Started',
    q: 'Do I Need to Be a Tax Professional to Use It?',
    a: 'No. CukaiPandai is written for SME owners and finance staff. It explains the rule and trace behind each figure in plain language. For anything binding, have a licensed tax agent or qualified professional review the output before you rely on it.'
  },

  // Sovereignty & Data
  {
    category: 'Sovereignty & Data',
    featured: true,
    q: 'Where Does the AI Inference Run?',
    a: 'CukaiPandai routes to ILMU first, using the sovereign nemo-super model for in-country inference. Escalation stays sovereign by default through a stronger model on the same ILMU gateway. A direct Anthropic or Claude call is a flagged, off-by-default opt-in that leaves Malaysia.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'What Does Sovereign Inference Mean Here?',
    a: 'It means the model route that reasons over your filing data is hosted in-country by default. Sovereignty is about where inference happens and who controls that route. It does not mean every deployment dependency is automatically Malaysian.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'Does All Data Stay in Malaysia?',
    a: 'Not as an unqualified claim. Inference and deterministic computation are in-country in the current design, but prelim persistence can use managed Neon Postgres in Singapore with fixture and in-memory fallback. The production sovereignty path is self-hosted or Malaysia-region Postgres with the same schema.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'What Is ILMU nemo-super?',
    a: 'It is the sovereign Malaysian model CukaiPandai routes to first for its language reasoning. The application orchestrates this model but never lets it invent tax figures or law; the numbers and legal references always come from the deterministic core, not from the model.'
  },
  {
    category: 'Sovereignty & Data',
    q: 'Does the Model Make the Tax Calculations?',
    a: 'No. The deterministic core owns all tax math, deadlines, rule IDs, and citation lookups. The model layer can classify, orchestrate, and explain, but the authoritative figures come from the core so they remain reproducible.'
  },

  // Citations & Accuracy
  {
    category: 'Citations & Accuracy',
    featured: true,
    q: 'How Does the Citation Gate Work?',
    a: 'Before a clause reference is trusted, a deterministic verifier checks the clause ID against the verified law corpus. If the ID is not present, the citation is rejected instead of being treated as real. The Audit Assistant trust demo shows this with a fabricated clause.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'Can the AI Make Up a Tax Figure or Law?',
    a: 'The system is built to prevent that. Tax figures come from the deterministic core, and legal references are validated before they are trusted. If Pandai or any agent returns a fabricated clause ID, the deterministic gate marks it unverified and blocks it from passing as a real citation.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'What Does "Every Figure Is Cited" Mean?',
    a: 'Each computed filing figure carries a trace: value, inputs, rule ID, and YA2026 config version. The UI exposes those traces in the filing record, and Pandai answers against the selected filing evidence rather than inventing figures.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'What Year Are the Figures Based On?',
    a: 'The app currently targets YA2026. Obligation dates, filing traces, and mock Form C computations use the YA2026 configuration. The specific values appear inside the consoles with their trace and source context.'
  },
  {
    category: 'Citations & Accuracy',
    q: 'What Happens if a Source Cannot Be Verified?',
    a: 'It is rejected. The design favours showing nothing over showing an unverifiable claim, because in a tax context a confident but wrong citation is worse than an honest gap. Rejected references are surfaced so you know the gate acted.'
  },

  // Filing & Compliance
  {
    category: 'Filing & Compliance',
    featured: true,
    q: 'Does CukaiPandai File Form C for Me Automatically?',
    a: 'No. It prepares a cited Form C computation and can generate a draft pack for review, but it does not submit to LHDN or MyTax. The filing graph includes a human-in-the-loop approval interrupt, and any real filing decision remains with you or your authorised tax agent.'
  },
  {
    category: 'Filing & Compliance',
    q: 'What Does Filing Do Today?',
    a: 'Filing accepts an Income Statement, P&L, Trial Balance, or structured manual line items. It maps the rows to fixed tax accounts, creates a draft record after classification, then the deterministic core computes Form C and tax payable. The app auto-saves the same record as final after computation.'
  },
  {
    category: 'Filing & Compliance',
    featured: true,
    q: 'What Can I Ask Pandai in Audit Assistant?',
    a: 'Select a saved filing, click a figure such as tax payable or chargeable income, or type your own question. Pandai answers from the filing evidence and verified citations, shows inline citation chips, and keeps per-filing conversation history.'
  },
  {
    category: 'Filing & Compliance',
    q: 'Is This Legal or Tax Advice?',
    a: 'No. CukaiPandai is decision support, not legal or tax advice, and it does not replace a licensed tax agent. Use it to understand your position and prepare your figures, then have a qualified professional review anything you intend to submit.'
  },
  {
    category: 'Filing & Compliance',
    q: 'How Are My Filing Deadlines Determined?',
    a: 'The Obligations console derives the YA2026 calendar from the entity profile and applicable rules, then lists the forms and due dates that apply. Seeded personas include state-aware, fixture-backed dates; custom mock entities derive their own calendar from the entered profile.'
  },
  {
    category: 'Filing & Compliance',
    q: 'What Is the Human Approval Gate?',
    a: 'The backend filing graph has a HITL interrupt that pauses for approval before the workflow is treated as approved. In the UI, the saved filing and draft pack remain review aids. Nothing is submitted externally without a human decision.'
  },
  {
    category: 'Filing & Compliance',
    q: 'Is the Demo Using Real Company Data?',
    a: 'No. The live demo uses seeded Malaysian SME fixture data, including Acme Trading and other sample personas. Mock mode can also derive demo obligations and filings in the browser. It is not a real taxpayer dataset.'
  },

  // Privacy & Account
  {
    category: 'Privacy & Account',
    q: 'How Is My Data Handled?',
    a: 'The product separates deterministic tax computation from model reasoning and routes inference through sovereign ILMU by default. Guest and demo flows may use shared seeded data or fixture-backed storage, so do not enter real taxpayer data into a public demo environment.'
  },
  {
    category: 'Privacy & Account',
    q: 'Can I Switch Between Entities?',
    a: 'Yes. The entity switcher in the top bar lets you change the active entity, and the consoles update to reflect that entity profile. In the demo this moves you between the seeded sample companies.'
  },
  {
    category: 'Privacy & Account',
    q: 'How Do I Sign Out?',
    a: 'Open the profile menu in the top bar and choose Sign Out. In the demo this clears the local session marker and returns you to the landing page. Signing in or out never submits a filing.'
  }
]
