from __future__ import annotations

import json
import os
from pathlib import Path


class MsicClient:
    """MSIC activity-code reference lookup.

    Live source: data.gov.my data-catalogue (`?id=msic`, no auth, ~4 req/min). Pass
    ``fixtures_path`` to read a local JSON copy instead (used by offline tests). Rows look
    like {item(5-digit), class(4), group(3), division(2), section(letter), desc_en, ...}.
    """

    def __init__(
        self,
        base_url: str | None = None,
        fixtures_path: str | None = None,
        dataset_id: str = "msic",
    ):
        self._base = base_url or os.getenv("DATA_GOV_MY_URL", "https://api.data.gov.my/data-catalogue")
        self._fixtures = fixtures_path
        self._dataset_id = dataset_id
        self._cache: list[dict] | None = None

    def _rows(self) -> list[dict]:
        if self._cache is None:
            if self._fixtures:
                self._cache = json.loads(Path(self._fixtures).read_text(encoding="utf-8"))
            else:
                import httpx

                r = httpx.get(
                    self._base, params={"id": self._dataset_id}, timeout=30, follow_redirects=True
                )
                r.raise_for_status()
                self._cache = r.json()
        return self._cache

    # MSIC level → (field, digit-count) the code is matched against at that level.
    _LEVELS = {5: ("item", 5), 4: ("class", 4), 3: ("group", 3), 2: ("division", 2)}

    def lookup(self, code: str) -> dict | None:
        """Find the MSIC entry for a code at its own level (no cross-level mismatches).
        A 5-digit code padded with a trailing 0 (e.g. 46900) falls back to its 4-digit class."""
        code = str(code).strip()
        rows = self._rows()

        def _match(field: str, digits: int) -> dict | None:
            return next((r for r in rows if r.get(field) == code and r.get("digits") == digits), None)

        if len(code) == 1 and code.isalpha():  # section letter (case-insensitive)
            up = code.upper()
            return next((r for r in rows if r.get("section") == up and r.get("digits") == 1), None)
        level = self._LEVELS.get(len(code))
        if level is None:
            return None
        hit = _match(*level)
        if hit is None and len(code) == 5 and code.endswith("0"):  # padded class, e.g. 46900 -> 4690
            cls = code[:4]
            hit = next((r for r in rows if r.get("class") == cls and r.get("digits") == 4), None)
        return hit
