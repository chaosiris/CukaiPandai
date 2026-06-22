import { ClauseList } from "../../components/ClauseList";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { CLAUSES } from "../../lib/corpus";

export default function CorpusPage() {
  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <PageHeader title="Law Corpus" eyebrow="The citation contract" />

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Panel title="Clauses" label={`${CLAUSES.length} in corpus`}>
            <p className="mb-5 text-sm leading-relaxed text-muted">
              These are the Income Tax Act clauses that back every citation. A figure may only cite a
              clause that exists here — anything else is rejected by the citation verifier.
            </p>
            <ClauseList clauses={CLAUSES} />
          </Panel>

          <div className="space-y-5">
            <Panel title="Contract note" label="proof">
              <p className="text-sm leading-relaxed text-muted">
                Deductions and procedures justify a figure; penalty clauses size the exposure if a
                position is not sustained. A claim with no clause in the corpus shows no proof.
              </p>
              <p className="display mt-5 text-lg italic text-accent">Every citation has a receipt.</p>
            </Panel>
            <Panel title="How it is used" label="guide">
              <p className="text-sm leading-relaxed text-muted">
                The deterministic gate checks a cited clause id exists here; an LLM critic then checks
                the clause actually supports the claim. Both must pass before a citation is marked
                verified.
              </p>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
