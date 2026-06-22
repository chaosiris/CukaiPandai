import json

from api.agents.profiler import build_profile
from api.connectors.myinvois import MyInvoisClient


def test_profile_pulls_turnover():
    ssm = json.loads(open("core/fixtures/entity_acme.json").read())
    p = build_profile(ssm, MyInvoisClient("core/fixtures/myinvois_acme.json"))
    assert p.tin == "C2581234509"
    assert p.gross_income == 120000  # overridden from MyInvois turnover
