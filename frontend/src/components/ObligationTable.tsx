import type { ObligationCalendar } from "../lib/types";

const TYPE_LABEL: Record<string, string> = {
  income_tax: "Income Tax",
  einvoice: "E-Invoice",
  sst: "Sales & Service Tax",
  employer_mtd: "Employer / MTD",
};

export function ObligationTable({ calendar }: { calendar: ObligationCalendar }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-panel-raised font-mono text-xs uppercase tracking-widest text-muted">
            <th className="px-4 py-3 font-medium">Obligation</th>
            <th className="px-4 py-3 font-medium">Form</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Rule</th>
          </tr>
        </thead>
        <tbody>
          {calendar.obligations.map((o, i) => (
            <tr key={`${o.form}-${i}`} className="border-t border-line">
              <td className="px-4 py-3 text-ink">{TYPE_LABEL[o.obligation_type] ?? o.obligation_type}</td>
              <td className="px-4 py-3">
                <span className="chip">{o.form}</span>
              </td>
              <td className="px-4 py-3 font-mono text-ink">{o.due_date}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs uppercase tracking-wider text-warn">{o.status}</span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted">{o.rule_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
