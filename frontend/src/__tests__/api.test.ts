import { beforeEach, describe, expect, test } from "vitest";
import { auditDefense, computeFormC, getObligations } from "../lib/api";

describe("api client (mock mode)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_MOCK = "1";
  });

  test("computeFormC returns the Acme golden figure + approval gate", async () => {
    const r = await computeFormC("C2581234509", {}, []);
    expect(r.computation.fields.tax_payable.value).toBe(31000);
    expect(r.requires_approval).toBe(true);
  });

  test("getObligations returns a calendar with the income-tax Form C", async () => {
    const cal = await getObligations("C2581234509", {});
    expect(cal.obligations.some((o) => o.form === "C")).toBe(true);
  });

  test("auditDefense returns a verified pack for a normal query", async () => {
    const pack = await auditDefense("C2581234509", "Justify repairs", []);
    expect(pack.citations[0].verified).toBe(true);
  });

  test("auditDefense rejects a fabricated clause", async () => {
    const pack = await auditDefense("C2581234509", "use a fake clause", []);
    expect(pack.citations[0].verified).toBe(false);
  });
});
