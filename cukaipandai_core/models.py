from __future__ import annotations

from datetime import date

from pydantic import BaseModel


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


class Citation(BaseModel):
    claim: str
    clause_ids: list[str]
    verified: bool = False
