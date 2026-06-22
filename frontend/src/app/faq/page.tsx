import { FaqList } from "../../components/FaqList";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { FAQ_ITEMS } from "../../lib/faq";

export default function FaqPage() {
  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-4xl px-5 py-14">
        <PageHeader title="FAQ" eyebrow="How CukaiPandai works" />
        <Panel title="FAQ" label={`${FAQ_ITEMS.length} answers`}>
          <p className="mb-5 text-sm leading-relaxed text-muted">
            Straight answers about how CukaiPandai derives obligations, cites every figure to source
            and law, verifies citations, and keeps a human in control of the filing.
          </p>
          <FaqList items={FAQ_ITEMS} />
        </Panel>
      </div>
    </main>
  );
}
