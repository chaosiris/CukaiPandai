from __future__ import annotations

from pydantic import BaseModel


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


class FilingResumeReq(BaseModel):
    thread_id: str
    approved: bool


class ClassifyReq(BaseModel):
    raw_text: str
