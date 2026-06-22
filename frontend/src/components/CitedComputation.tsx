import type { FormComputation } from "../lib/types";

const FIELD_LABEL: Record<string, string> = {
  chargeable_income: "Chargeable income",
  tax_payable: "Tax payable",
};

function rm(value: number) {
  return `RM ${value.toLocaleString("en-MY")}`;
}

export function CitedComputation({
  computation,
  onApprove,
  approved = false,
}: {
  computation: FormComputation;
  onApprove: () => void;
  approved?: boolean;
}) {
  return (
    <div>
      <ul className="space-y-2.5">
        {Object.entries(computation.fields).map(([key, f]) => (
          <li
            key={key}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-line bg-panel-raised px-4 py-3"
          >
            <span className="text-sm text-muted">{FIELD_LABEL[key] ?? key}</span>
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-base font-bold text-ink">{rm(f.value)}</span>
              <span className="chip" title="Citation — the rule this figure traces to">
                cited: {f.rule_id}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onApprove}
          disabled={approved}
        >
          {approved ? "Approved ✓" : "Approve & prepare for MyTax"}
        </button>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Human-in-the-loop · nothing is filed without sign-off
        </span>
      </div>
    </div>
  );
}
