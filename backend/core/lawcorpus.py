from __future__ import annotations

import json
from pathlib import Path

from core.models import Clause


class LawCorpus:
    def __init__(self, clauses: dict[str, Clause]):
        self._c = clauses

    @classmethod
    def load(cls, path: Path) -> "LawCorpus":
        data = json.loads(Path(path).read_text(encoding="utf-8"))
        return cls({c["clause_id"]: Clause(**c) for c in data})

    def get(self, clause_id: str) -> Clause | None:
        return self._c.get(clause_id)

    def exists(self, clause_id: str) -> bool:
        return clause_id in self._c

    def ids(self) -> list[str]:
        return list(self._c)
