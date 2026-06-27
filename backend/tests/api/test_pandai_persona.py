"""BE-2.2 — Tests for the Pandai 5-layer persona assembler and the citation-safety regression."""
from __future__ import annotations

import re
from pathlib import Path

import pytest

from api.agents.pandai_persona import _load_primer, build_pandai_system


# ---------------------------------------------------------------------------
# Primer file sanity
# ---------------------------------------------------------------------------

_PRIMER_PATH = Path(__file__).parent.parent.parent / "api/agents/pandai_primer.md"


def test_primer_file_exists():
    assert _PRIMER_PATH.exists(), "pandai_primer.md must exist in api/agents/"


def test_primer_has_no_asserted_numeric_figures():
    """Citation-safety regression: the primer must contain no asserted % rates, RM amounts,
    or bare rate/threshold numbers. This gate ensures the primer cannot silently become an
    uncited-figure source."""
    body = _PRIMER_PATH.read_text(encoding="utf-8")
    # No percentage figures (e.g. 17%, 24%, 2%)
    assert not re.search(r"\b\d+\.?\d*\s*%", body), (
        "Primer must not assert any percentage figures -- found one. "
        "Rates/thresholds must come from the live filing or verified citations."
    )
    # No RM amounts (e.g. RM 2,500,000 or RM2500000)
    assert not re.search(r"\bRM\s*[\d,]+", body, re.IGNORECASE), (
        "Primer must not contain any RM monetary amounts."
    )
    # No bare multi-digit numbers that look like thresholds (e.g. 2,500,000 or 150,000)
    # We check for numbers with commas (common threshold format) but allow page references
    # like "(s.33)" -- only flag standalone comma-formatted numbers.
    # A conservative check: no number >= 1,000 formatted with commas.
    assert not re.search(r"\b\d{1,3}(?:,\d{3})+\b", body), (
        "Primer must not contain comma-formatted threshold numbers (e.g. 2,500,000)."
    )


def test_primer_has_no_authoritative_clause_ids():
    """Primer must not embed authoritative clause IDs (e.g. ITA-1967-s33(1)) that could
    be passed through to the citation gate as if verified."""
    body = _PRIMER_PATH.read_text(encoding="utf-8")
    # No ITA-1967-style formatted IDs (the format used by the corpus and gate)
    assert not re.search(r"\bITA-\d{4}-s\d+\b", body), (
        "Primer must not contain authoritative ITA-YYYY-sNN clause IDs."
    )


def test_primer_research_sources_stripped():
    """The '## Research sources' section must NOT be present in the shipped primer."""
    body = _PRIMER_PATH.read_text(encoding="utf-8")
    assert "## Research sources" not in body, (
        "The '## Research sources' section must be stripped before shipping."
    )


# ---------------------------------------------------------------------------
# 5-layer assembler
# ---------------------------------------------------------------------------

def test_all_five_layers_present():
    """The assembled system prompt must contain content from all 5 layers."""
    system = build_pandai_system(None)
    # Layer 1 — Language
    assert "LANGUAGE" in system or "English" in system
    # Layer 2 — Persona
    assert "Pandai" in system
    # Layer 3 — Hard Rules
    assert "HARD RULES" in system
    assert "SCOPE" in system
    # Layer 4 — Primer (spot-check a stable phrase)
    assert "KNOWLEDGE PRIMER" in system
    assert "LHDN" in system
    # Layer 5 — Live Digest placeholder
    assert "LIVE FILING DIGEST" in system


def test_layers_in_order():
    """Layers appear in declaration order: Language < Persona < Hard Rules < Primer < Digest."""
    system = build_pandai_system(None)
    lang_pos = system.index("LANGUAGE")
    persona_pos = system.index("Pandai")
    rules_pos = system.index("HARD RULES")
    primer_pos = system.index("KNOWLEDGE PRIMER")
    digest_pos = system.index("LIVE FILING DIGEST")
    assert lang_pos < persona_pos < rules_pos < primer_pos < digest_pos


def test_no_greeting_rule_present():
    """The Hard Rules layer must explicitly prohibit greetings."""
    system = build_pandai_system(None)
    assert "NO GREETING" in system or "no greeting" in system.lower()


def test_no_filing_produces_placeholder_digest():
    system = build_pandai_system(None)
    assert "No filing is currently selected" in system


def test_filing_digest_injects_figures():
    digest = {
        "tin": "C2581234509",
        "label": "Acme YA2026",
        "status": "final",
        "computation": {
            "fields": {
                "tax_payable": {"value": 31000.0, "rule_id": "FORM-C-2024-r5", "config_version": "v1"},
                "chargeable_income": {"value": 200000.0, "rule_id": "FORM-C-2024-r3", "config_version": "v1"},
            }
        },
        "line_items": [
            {"code": "6010", "description": "Sales", "amount": 500000.0, "category": "revenue"}
        ],
    }
    system = build_pandai_system(digest)
    assert "31000.0" in system
    assert "200000.0" in system
    assert "Sales" in system
    assert "C2581234509" in system
    assert "Acme YA2026" in system


def test_locale_stub_english():
    system_en = build_pandai_system(None, locale="en")
    assert "English" in system_en


def test_primer_cached():
    """_load_primer returns consistent content (cache hit)."""
    first = _load_primer()
    second = _load_primer()
    assert first == second
    assert len(first) > 500  # sanity: not empty


def test_hard_rules_cite_filing_numbers():
    system = build_pandai_system(None)
    assert "filing" in system.lower() and ("figure" in system.lower() or "filing" in system.lower())


# ---------------------------------------------------------------------------
# build_defense integration — answer + followups
# ---------------------------------------------------------------------------

def test_build_defense_returns_answer_and_followups():
    """build_defense must return a non-empty answer and exactly 3 followups."""
    from pathlib import Path as _Path

    from api.agents.audit_defense import build_defense
    from api.llm import FakeLLMClient
    from core.lawcorpus import LawCorpus

    C = LawCorpus.load(_Path("core/fixtures/lawcorpus_seed.json"))
    scripted = [
        '{"contested_item":"Repairs RM4,800","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"],'
        '"answer":"Your repairs deduction of RM 4,800 is supported by the general deduction rule as applied by the core.",'
        '"followups":["What documents should I keep?","How does LHDN typically verify this?","What if I lose the receipts?"]}',
        "YES",
    ]
    pack = build_defense(
        "Justify your RM4,800 repairs deduction",
        evidence=[],
        llm=FakeLLMClient(scripted),
        corpus=C,
    )
    assert isinstance(pack.answer, str) and len(pack.answer) > 0
    assert isinstance(pack.followups, list)
    assert len(pack.followups) == 3


def test_build_defense_pads_followups_to_three():
    """If the model returns fewer than 3 followups, pad with empty strings to exactly 3."""
    from pathlib import Path as _Path

    from api.agents.audit_defense import build_defense
    from api.llm import FakeLLMClient
    from core.lawcorpus import LawCorpus

    C = LawCorpus.load(_Path("core/fixtures/lawcorpus_seed.json"))
    scripted = [
        '{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"],'
        '"answer":"Some answer.","followups":["One question?"]}',
        "YES",
    ]
    pack = build_defense("query", evidence=[], llm=FakeLLMClient(scripted), corpus=C)
    assert len(pack.followups) == 3


def test_build_defense_with_filing_digest():
    """build_defense accepts a filing_digest and passes it to the persona assembler."""
    from pathlib import Path as _Path

    from api.agents.audit_defense import build_defense
    from api.llm import FakeLLMClient
    from core.lawcorpus import LawCorpus

    C = LawCorpus.load(_Path("core/fixtures/lawcorpus_seed.json"))
    digest = {
        "tin": "C2581234509",
        "label": "Acme",
        "computation": {"fields": {"tax_payable": {"value": 31000.0, "rule_id": "r1", "config_version": "v1"}}},
    }
    scripted = [
        '{"contested_item":"Tax","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"],'
        '"answer":"Based on your filing, tax payable is as computed.","followups":["Q1?","Q2?","Q3?"]}',
        "YES",
    ]
    pack = build_defense("Why is my tax payable this amount?", evidence=[], llm=FakeLLMClient(scripted), corpus=C, filing_digest=digest)
    assert pack.citations[0].verified is True
    assert pack.answer != ""
    assert len(pack.followups) == 3


def test_fabricated_probe_still_rejected_with_persona():
    """BE-18 money-shot: inject_fabricated=True still rejects the fabricated clause even with
    the new 5-layer persona system prompt."""
    from pathlib import Path as _Path

    from api.agents.audit_defense import _FAKE_CLAUSE_ID, build_defense
    from api.llm import FakeLLMClient
    from core.lawcorpus import LawCorpus

    C = LawCorpus.load(_Path("core/fixtures/lawcorpus_seed.json"))
    scripted = [
        '{"contested_item":"Repairs","claim":"deductible under s.33(1)","clause_ids":["ITA-1967-s33(1)"],'
        '"answer":"The repairs are deductible.","followups":["Q1?","Q2?","Q3?"]}',
        "YES",
    ]
    pack = build_defense(
        "Justify repairs",
        evidence=[],
        llm=FakeLLMClient(scripted),
        corpus=C,
        inject_fabricated=True,
    )
    fake_cits = [c for c in pack.citations if _FAKE_CLAUSE_ID in c.clause_ids]
    assert len(fake_cits) == 1
    assert fake_cits[0].verified is False, "fabricated clause must still be rejected by the gate"
