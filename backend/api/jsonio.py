from __future__ import annotations

import json
import re
from typing import Any

# Matches an optional ```/```lang ... ``` markdown fence wrapping the payload (single- or multi-line).
_FENCE = re.compile(r"^\s*```[a-zA-Z0-9]*\s*(.*?)\s*```\s*$", re.DOTALL)


def loads_relaxed(text: str) -> Any:
    """Parse JSON, tolerating a markdown code fence (```/```json) that some models wrap around it."""
    s = text.strip()
    m = _FENCE.match(s)
    if m:
        s = m.group(1).strip()
    return json.loads(s)
