import pytest

from api.llm import FakeLLMClient


def test_fake_returns_scripted_in_order():
    llm = FakeLLMClient(["a", "b"])
    assert llm.complete("s", "u") == "a"
    assert llm.complete("s", "u") == "b"


def test_fake_exhausted_raises():
    llm = FakeLLMClient(["only"])
    llm.complete("s", "u")
    with pytest.raises(IndexError):
        llm.complete("s", "u")
