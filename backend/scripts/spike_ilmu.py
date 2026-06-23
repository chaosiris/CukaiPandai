"""BE-1 spike — run the LLM agents against the live model (ILMU nemo-super by default).

Not a pytest test (it makes real network calls). Run from backend/:
    PYTHONPATH=. python scripts/spike_ilmu.py
Requires LLM_* in the repo-root .env. Resolves plan Q1 (per-task quality / where to escalate).
"""
from __future__ import annotations

import sys
import traceback
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from api.agents.audit_defense import build_defense  # noqa: E402
from api.agents.deductibility import cite_treatment  # noqa: E402
from api.agents.citation_critic import verify_claim  # noqa: E402
from api.agents.documents import classify_line_items  # noqa: E402
from api.llm import make_llm  # noqa: E402
from core.lawcorpus import LawCorpus  # noqa: E402
from core.models import Citation, LineItem  # noqa: E402

CORPUS = LawCorpus.load(Path("core/fixtures/lawcorpus_seed.json"))
TRIAL = "4000 Revenue 500000\n5000 Allowable operating expenses 300000"


def step(name, fn):
    try:
        result = fn()
        print(f"[PASS] {name}: {result}")
        return True
    except Exception as e:  # noqa: BLE001
        print(f"[FAIL] {name}: {type(e).__name__}: {e}")
        traceback.print_exc(limit=1)
        return False


def main() -> int:
    llm = make_llm()
    print(f"client = {type(llm).__name__}\n")
    ok = []
    ok.append(step("documents.classify_line_items",
        lambda: [(i.code, i.category, i.amount) for i in classify_line_items(TRIAL, llm)]))
    ok.append(step("deductibility.cite_treatment",
        lambda: (lambda c: (c.verified, c.clause_ids))(cite_treatment(
            LineItem(code="5000", description="Repairs", amount=4800, category="deductible"), llm, CORPUS))))
    ok.append(step("citation_critic.verify_claim (escalates)",
        lambda: verify_claim(Citation(claim="Repairs deductible under s.33(1)",
            clause_ids=["ITA-1967-s33(1)"]), CORPUS, llm).verified))
    ok.append(step("audit_defense.build_defense",
        lambda: (lambda p: (p.items[0]["contested_item"], p.citations[0].verified))(build_defense(
            "Justify your RM4,800 repairs deduction",
            [("tax_payable", "tb", "ITA-1967-s33(1)")], llm, CORPUS))))
    print(f"\n{sum(ok)}/{len(ok)} agents parsed live model output.")
    return 0 if all(ok) else 1


if __name__ == "__main__":
    sys.exit(main())
