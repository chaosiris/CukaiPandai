import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { CLAUSES } from "../lib/corpus";

// Guard against drift between the frontend law-corpus display data and the authoritative
// backend seed. clause_id / source / text must mirror the seed verbatim.
const here = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(here, "../../../core/fixtures/lawcorpus_seed.json");
const seed: { clause_id: string; source: string; text: string }[] = JSON.parse(
  readFileSync(seedPath, "utf-8"),
);

describe("law corpus parity with backend seed", () => {
  test("clause ids match the backend seed exactly", () => {
    expect(new Set(CLAUSES.map((c) => c.clause_id))).toEqual(
      new Set(seed.map((s) => s.clause_id)),
    );
  });

  test("each clause's source and text mirror the seed verbatim", () => {
    const bySeed = new Map(seed.map((s) => [s.clause_id, s]));
    for (const c of CLAUSES) {
      const s = bySeed.get(c.clause_id);
      expect(s, `no seed entry for ${c.clause_id}`).toBeTruthy();
      expect(c.source).toBe(s!.source);
      expect(c.text).toBe(s!.text);
    }
  });
});
