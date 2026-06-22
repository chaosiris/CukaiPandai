from cukaipandai_api.connectors.myinvois import MyInvoisClient


def test_turnover_from_fixtures():
    c = MyInvoisClient(fixtures_path="cukaipandai_core/fixtures/myinvois_acme.json")
    docs = c.search_documents("C2581234509")
    assert c.derive_turnover(docs, "C2581234509") == 120000
