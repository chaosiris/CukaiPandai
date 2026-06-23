import pytest

from core.config_loader import load_ya_config


def test_loads_ya2026():
    cfg = load_ya_config(2026)
    assert cfg["version"].startswith("YA2026")
    assert cfg["income_tax"]["non_sme_rate"] == 0.24


def test_unknown_ya_raises():
    with pytest.raises(ValueError):
        load_ya_config(1999)
