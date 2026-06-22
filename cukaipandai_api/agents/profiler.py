from __future__ import annotations

from cukaipandai_core.models import EntityTaxProfile

from cukaipandai_api.connectors.myinvois import MyInvoisClient


def build_profile(ssm: dict, myinvois: MyInvoisClient) -> EntityTaxProfile:
    docs = myinvois.search_documents(ssm["tin"])
    turnover = myinvois.derive_turnover(docs, ssm["tin"])
    data = {**ssm, "gross_income": turnover}
    return EntityTaxProfile(**data)
