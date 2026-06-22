import json

from cukaipandai_api.agents.profiler import build_profile
from cukaipandai_api.connectors.myinvois import MyInvoisClient


def test_profile_pulls_turnover():
    ssm = json.loads(open("cukaipandai_core/fixtures/entity_acme.json").read())
    p = build_profile(ssm, MyInvoisClient("cukaipandai_core/fixtures/myinvois_acme.json"))
    assert p.tin == "C2581234509"
    assert p.gross_income == 120000  # overridden from MyInvois turnover
