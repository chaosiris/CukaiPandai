from api.agents.documents import classify_line_items
from api.llm import FakeLLMClient


def test_classify_parses_llm_json():
    scripted = [
        '[{"code":"4000","description":"Revenue","amount":500000,"category":"income"},'
        '{"code":"5000","description":"Expenses","amount":300000,"category":"deductible"}]'
    ]
    items = classify_line_items("...trial balance text...", FakeLLMClient(scripted))
    assert len(items) == 2
    assert items[0].category == "income"
