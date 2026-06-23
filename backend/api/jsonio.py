from __future__ import annotations

import json
import re
from typing import Any

# Find a ```/```json ... ``` fenced block anywhere in the reply (tolerates surrounding prose),
# not only when the fence wraps the entire message.
_FENCE = re.compile(r"```[a-zA-Z0-9]*\s*(.*?)\s*```", re.DOTALL)


def loads_relaxed(text: str) -> Any:
    """Parse JSON, tolerating a markdown code fence (```/```json) around it, including when
    the model adds prose before/after the fence. Raises ValueError if no JSON can be parsed."""
    s = text.strip()
    m = _FENCE.search(s)
    if m:
        s = m.group(1).strip()
    return json.loads(s)
