import { acmeCalendar, acmeDefense, acmeFormC, fabricatedDefense } from "./fixtures";
import type { DefensePack, FormCResult, LineItem, ObligationCalendar } from "./types";

// Mock-by-default so the UI demos end-to-end with no backend.
// Set NEXT_PUBLIC_API_MOCK="0" to hit the real FastAPI service.
const MOCK = () => process.env.NEXT_PUBLIC_API_MOCK !== "0";
const BASE = () => process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(BASE() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status} ${r.statusText}`);
  return r.json() as Promise<T>;
}

export async function getObligations(tin: string, ssm: object): Promise<ObligationCalendar> {
  if (MOCK()) return acmeCalendar;
  return post(`/entities/${tin}/obligations`, { ssm });
}

export async function computeFormC(
  tin: string,
  ssm: object,
  lineItems: LineItem[],
): Promise<FormCResult> {
  if (MOCK()) return { computation: acmeFormC, requires_approval: true };
  return post(`/entities/${tin}/filings/form-c`, { ssm, line_items: lineItems });
}

export async function auditDefense(
  tin: string,
  query: string,
  evidence: string[][],
): Promise<DefensePack> {
  if (MOCK()) {
    // Demo the integrity gate: a "fake"/"made-up" query returns an unverified pack.
    return /fake|made[- ]?up|s\.?999/i.test(query) ? fabricatedDefense : acmeDefense;
  }
  return post(`/entities/${tin}/audit-defense`, { query, evidence });
}
