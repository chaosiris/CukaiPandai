from __future__ import annotations

from pathlib import Path

import yaml

_CONFIG_DIR = Path(__file__).parent / "config"


def load_ya_config(ya: int) -> dict:
    path = _CONFIG_DIR / f"ya_{ya}.yaml"
    if not path.exists():
        raise ValueError(f"No tax config for YA{ya}")
    return yaml.safe_load(path.read_text(encoding="utf-8"))
