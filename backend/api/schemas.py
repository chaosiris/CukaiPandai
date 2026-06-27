from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class FilingRecordReq(BaseModel):
    tin: str
    label: str | None = None
    computation: dict | None = None
    risk_flags: list[dict] = []
    line_items: list[dict] | None = None
    status: Literal["draft", "final"] = "final"
    raw_text: str | None = None


class FilingRecordPatch(BaseModel):
    computation: dict | None = None
    risk_flags: list[dict] | None = None
    line_items: list[dict] | None = None
    status: Literal["draft", "final"] | None = None
    label: str | None = None
    raw_text: str | None = None


class MultiDeleteReq(BaseModel):
    ids: list[str]


class SignupReq(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginReq(BaseModel):
    email: str
    password: str


class GoogleAuthReq(BaseModel):
    id_token: str


class EntityCreateReq(BaseModel):
    ssm: dict


class ObligationsReq(BaseModel):
    ssm: dict


class FormCReq(BaseModel):
    ssm: dict
    line_items: list[dict]


class AuditDefenseReq(BaseModel):
    query: str
    evidence: list[list[str]]
    inject_fabricated: bool = False
    filing_id: str | None = None


class FilingResumeReq(BaseModel):
    thread_id: str
    approved: bool


class ClassifyReq(BaseModel):
    raw_text: str
