from core.evidence import EvidenceVault


def test_link_and_retrieve():
    v = EvidenceVault()
    v.link("tax_payable", "trial_balance_acme", "ITA-1967-s33(1)")
    assert ("trial_balance_acme", "ITA-1967-s33(1)") in v.links_for("tax_payable")


def test_audit_log_appends_in_order():
    v = EvidenceVault()
    v.log_action("agent:computation", "compute_form_c", "h1")
    v.log_action("human:controller", "approve", "h2")
    trail = v.audit_trail()
    assert [t["action"] for t in trail] == ["compute_form_c", "approve"]
