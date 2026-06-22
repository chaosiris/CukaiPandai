import Link from "next/link";
import { EntitiesGrid } from "../../components/EntitiesGrid";
import { PageHeader } from "../../components/PageHeader";
import { Panel } from "../../components/Panel";
import { ENTITIES } from "../../lib/entities";

export default function EntitiesPage() {
  return (
    <main className="paper-grid min-h-full">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <PageHeader title="Entities" eyebrow="Client companies · open one to see its obligations & filings" />

        <EntitiesGrid entities={ENTITIES} />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Panel title="Heads up" label="info">
            <p className="text-sm leading-relaxed text-muted">
              In this build, only <b className="text-ink">Acme Sdn Bhd</b> is wired to live
              computation — it actually calls the deterministic core. The other entities are
              illustrative so you can see how a tax-agent firm manages many clients at once.
            </p>
          </Panel>
          <Panel title="Try this" label="suggestion">
            <p className="text-sm leading-relaxed text-muted">
              Open Acme, derive its obligation calendar, then jump to the{" "}
              <Link href="/filing" className="text-accent hover:underline">
                Filing Studio
              </Link>{" "}
              to compute a cited Form C with every figure traced to its source and the law.
            </p>
          </Panel>
        </div>
      </div>
    </main>
  );
}
