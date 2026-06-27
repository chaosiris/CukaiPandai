from __future__ import annotations

import re
from datetime import date

from pydantic import BaseModel, field_validator, model_validator

# LHDN Tax Identification Number (Nombor Pengenalan Cukai) prefixes. A TIN is a prefix code
# followed by digits (post-2023 a trailing 0 was appended, so the digit count varies).
_TIN_PREFIXES = {
    "C",   # company (Sdn Bhd / Bhd)
    "CS",  # co-operative society
    "D",   # partnership
    "E",   # employer
    "F",   # association
    "FA",  # non-resident public entertainer
    "PT",  # limited liability partnership (LLP)
    "TA",  # trust body
    "TC",  # unit trust / property trust
    "TN",  # business trust
    "TR",  # REIT / property trust fund
    "TP",  # deceased person's estate
    "J",   # Hindu joint family
    "LE",  # Labuan entity
    "IG",  # individual (since 2023; replaced SG/OG)
    "SG", "OG",  # individual (legacy, pre-2023)
}
# entity_type -> the TIN prefix LHDN issues for it (only the constrained types).
_ENTITY_TYPE_PREFIX = {
    "sdn_bhd": "C", "bhd": "C", "plc": "C", "company": "C",
    "partnership": "D",
    "llp": "PT",
    "sole_proprietor": "IG",
}
_TIN_RE = re.compile(r"^([A-Z]{1,2})(\d{8,12})$")

# Malaysian state / federal-territory ISO codes (accepted by the `holidays` package as a subdiv,
# enabling state-specific public-holiday shifting in the obligation calendar). None = national only.
_MY_STATES = {
    "JHR", "KDH", "KTN", "KUL", "LBN", "MLK", "NSN", "PHG",
    "PJY", "PLS", "PNG", "PRK", "SBH", "SGR", "SWK", "TRG",
}


class EntityTaxProfile(BaseModel):
    tin: str
    entity_type: str
    msic_codes: list[str]
    paid_up_capital: float
    gross_income: float
    employee_count: int
    sst_registered: bool
    basis_period_start: date
    basis_period_end: date
    commencement_date: date | None = None
    # State/FT ISO code (e.g. SGR, KUL). Optional — drives state-specific holiday shifting; None = national only.
    state: str | None = None

    @field_validator("state")
    @classmethod
    def _validate_state(cls, v: str | None) -> str | None:
        if not v:
            return None
        v = v.strip().upper()
        if v not in _MY_STATES:
            raise ValueError(
                f"Unknown Malaysian state code '{v}'. Use an ISO code, e.g. SGR (Selangor), "
                "KUL (Kuala Lumpur), PNG (Penang), JHR (Johor)."
            )
        return v

    @field_validator("tin")
    @classmethod
    def _validate_tin_format(cls, v: str) -> str:
        v = v.strip().upper()
        m = _TIN_RE.match(v)
        if not m or m.group(1) not in _TIN_PREFIXES:
            raise ValueError(
                "Invalid Malaysian TIN. Expected an LHDN prefix (e.g. C=Sdn Bhd, D=partnership, "
                "PT=LLP, IG=individual) followed by 8-12 digits, e.g. C2581234509"
            )
        return v

    @model_validator(mode="after")
    def _tin_prefix_matches_entity_type(self) -> EntityTaxProfile:
        expected = _ENTITY_TYPE_PREFIX.get(self.entity_type.strip().lower())
        if expected:
            prefix = _TIN_RE.match(self.tin).group(1)  # tin already validated + upper-cased
            if prefix != expected:
                raise ValueError(
                    f"A {self.entity_type} TIN must start with '{expected}' "
                    f"(got prefix '{prefix}'), e.g. {expected}1234567890"
                )
        return self


class Obligation(BaseModel):
    obligation_type: str
    form: str
    due_date: date
    rule_id: str
    config_version: str
    status: str = "pending"


class ObligationCalendar(BaseModel):
    entity_tin: str
    obligations: list[Obligation]


class LineItem(BaseModel):
    code: str
    description: str
    amount: float
    category: str


class FigureTrace(BaseModel):
    value: float
    inputs: list[str]
    rule_id: str
    config_version: str


class FormComputation(BaseModel):
    form: str
    fields: dict[str, FigureTrace]


class Clause(BaseModel):
    clause_id: str
    text: str
    source: str
    section: str | None = None
    page_ref: str | None = None
    url: str | None = None


class Citation(BaseModel):
    claim: str
    clause_ids: list[str]
    verified: bool = False
    # Provenance threaded from RAG retrieval (BE-13); None when retrieval is unavailable.
    section: str | None = None
    page_ref: str | None = None
    url: str | None = None
    passage: str | None = None


class RiskFlag(BaseModel):
    code: str
    message: str
    severity: str = "medium"


class DefensePack(BaseModel):
    query: str
    items: list[dict]
    citations: list[Citation]
    exposure_note: str
    answer: str = ""
    followups: list[str] = []
