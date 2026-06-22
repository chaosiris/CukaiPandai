export type FaqItem = {
  id: string;
  q: string;
  a: string;
  category: FaqCategory;
};

export type FaqCategory =
  | "Getting Started"
  | "Citations"
  | "Trust"
  | "Obligations"
  | "Operations";

export const FAQ_CATEGORIES: FaqCategory[] = [
  "Getting Started",
  "Citations",
  "Trust",
  "Obligations",
  "Operations",
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what",
    category: "Getting Started",
    q: "What does CukaiPandai do?",
    a: "It turns a Malaysian company's books and source documents into an audit-ready tax filing — deriving what the entity owes, computing Form C where every figure is cited to its source line and the exact Income Tax Act clause, and assembling a defense pack when LHDN audits.",
  },
  {
    id: "train",
    category: "Getting Started",
    q: "Do I need to set anything up before using it?",
    a: "No training or model tuning. Tax rates, bands, thresholds and deadlines are versioned config keyed to the Year of Assessment, so the engine is correct on day one and a rule change is a config edit, not a code change.",
  },
  {
    id: "demo-flow",
    category: "Getting Started",
    q: "What is the main demo flow?",
    a: "Onboard an entity → derive its obligation calendar → compute a cited Form C → review audit-risk flags → paste an LHDN query and get a cited audit-defense pack. The whole flow runs on the seeded Acme entity with no backend in mock mode.",
  },
  {
    id: "cite",
    category: "Citations",
    q: "What counts as evidence behind a score?",
    a: "Every figure carries a FigureTrace (the rule id + config version it came from) and links to the source document line. Legal claims cite a clause that must exist in the law corpus — the deterministic gate plus an LLM critic verify it.",
  },
  {
    id: "fake",
    category: "Citations",
    q: "What happens to a fabricated or unsupported clause?",
    a: "It is blocked. If a cited clause is not present in the law corpus, the citation verifier marks it unverified and no proof is shown — the filing or defense cannot rest on it.",
  },
  {
    id: "trust",
    category: "Trust",
    q: "Can I trust the numbers?",
    a: "The deterministic core does all tax math from versioned config — the model never invents a figure. Outputs are cited, an independent verifier gates every clause, and a human approves before anything is filed.",
  },
  {
    id: "decision",
    category: "Trust",
    q: "Does CukaiPandai make the filing decision?",
    a: "No. It prepares and justifies the filing so a licensed tax agent or controller can decide faster and defend the call. The human stays in control via an approval gate on every mutating action.",
  },
  {
    id: "obligations",
    category: "Obligations",
    q: "How does it know what a company owes?",
    a: "No government API returns a company's obligations, so it derives them — assembling an Entity Tax Profile from SSM (entity type, MSIC, paid-up capital), MyInvois (turnover) and MySST, then running a deterministic rules engine. That derivation is the moat.",
  },
  {
    id: "sovereign",
    category: "Operations",
    q: "Where does inference run? Is data kept in Malaysia?",
    a: "The model layer is OpenAI-compatible, so one env-var swap runs it on ILMU Claw in sovereign mode — inference and data kept in-country, PDPA-resident. Otherwise it can use Claude or Gemini.",
  },
  {
    id: "audit-trail",
    category: "Operations",
    q: "Is there an audit trail?",
    a: "Yes. The Evidence Vault links each figure to its source document and clause, and an append-only audit log records every agent action and human approval — exportable for an LHDN review.",
  },
];
