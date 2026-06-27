from api.agents.documents import classify_line_items
from api.llm import FakeLLMClient


def test_classify_parses_llm_json():
    scripted = [
        '[{"code":"rev_sales","description":"Revenue","amount":500000,"category":"income"},'
        '{"code":"cos_purchases","description":"Expenses","amount":300000,"category":"deductible"}]'
    ]
    items = classify_line_items("...trial balance text...", FakeLLMClient(scripted))
    assert len(items) == 2
    assert items[0].category == "income"


def test_classify_drops_unknown_codes_and_amountless_rows():
    # Codes outside the taxonomy and rows without a numeric amount are dropped (noise rejection).
    scripted = [
        '{"line_items":['
        '{"code":"rev_sales","description":"Sales","amount":500000},'
        '{"code":"tung_tung_sahur","description":"gibberish","amount":999},'
        '{"code":"prem_rent","description":"Rent heading","amount":null}'
        "]}"
    ]
    items = classify_line_items("...", FakeLLMClient(scripted))
    assert [i.code for i in items] == ["rev_sales"]
    assert items[0].category == "income"  # category comes from the taxonomy, not the model
