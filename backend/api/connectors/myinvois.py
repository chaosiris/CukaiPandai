from __future__ import annotations

import json
from pathlib import Path


class MyInvoisClient:
    """MyInvois access. Fixture mode for the MVP/demo; live OAuth path is the
    production upgrade (see TRD §4.1 — sandbox at sdk.myinvois.hasil.gov.my)."""

    def __init__(self, fixtures_path: str | None = None):
        self._fx = fixtures_path

    def search_documents(self, tin: str) -> list[dict]:
        if self._fx:
            return json.loads(Path(self._fx).read_text(encoding="utf-8"))
        raise NotImplementedError("live MyInvois OAuth path — see TRD §4.1 (sandbox)")

    def derive_turnover(self, docs: list[dict], tin: str) -> float:
        return float(sum(d["total_excl_tax"] for d in docs if d.get("supplier_tin") == tin))
