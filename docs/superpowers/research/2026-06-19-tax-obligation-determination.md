# How to Determine a Malaysian Enterprise's Tax Obligations (CukaiPandai core bottleneck)

## TL;DR

**Obligations are DERIVED, not looked up.** No government API returns "Enterprise X owes these taxes." CukaiPandai must assemble an **Entity Tax Profile** from four sources — **SSM** (entity type + MSIC activity + paid-up capital), **MyInvois API** (actual transactions → turnover & evidence), **MySST** (SST registration), and **the firm's own payroll/AP data** — then run it through a **deterministic Obligation Rules Engine** keyed to the Income Tax Act 1967 and current LHDN/RMCD rules. **`developer.data.gov.my` is a reference layer only** (MSIC codes, public-holiday deadline math, DOSM benchmarks), confirmed by the same conclusion an earlier Layak research run reached about its rule-content gap. Evidence: [docs/initial-analysis/project-requirements.md], myai-future-hackathon `docs/superpowers/research/2026-05-12-data-gov-my-evaluation.md`.

## The derivation model

`Entity Tax Profile → Obligation Rules Engine → Obligation Calendar (form × deadline × est. amount × status)`

Inputs to the profile and where each comes from:

| Input                                                            | Source                                            | Access                                                             | Evidence                                                                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entity type, **MSIC** activity codes, paid-up capital, status    | **SSM** (SSM e-Info / MYDATA-SSM)                 | Authorised API ("Corporate Subscription Data" plan); paid/licensed | https://www.ssm-einfo.my/ , https://mydata-ssm.my/                                                                                                               |
| **Turnover**, sales/purchase transactions, tax codes, totals     | **LHDN MyInvois API**                             | REST, OAuth 2.0, TIN + NRIC/BRN; sandbox + prod                    | https://sdk.myinvois.hasil.gov.my/ , https://www.hasil.gov.my/en/e-invoice/reference-for-the-implementation-of-e-invoice/e-invoice-software-development-kit-sdk/ |
| **SST registration** status (sales/service)                      | **RMCD MySST**                                    | Status lookup (no rich public API) / customer-provided number      | https://mysst.customs.gov.my/ , https://sst01.customs.gov.my/account/inquiry                                                                                     |
| Employees, foreign payments, share disposals, related-party txns | **Internal** (payroll, AP, FA registers, uploads) | File upload / connector                                            | —                                                                                                                                                                |
| MSIC reference, **public-holiday calendar**, industry benchmarks | **developer.data.gov.my**                         | Open REST, **no auth, 4 req/min**                                  | https://developer.data.gov.my/ , https://developer.data.gov.my/quickstart , https://developer.data.gov.my/rate-limit                                             |

> See the dedicated deep-dive [2026-06-19-myinvois-api-integration.md](2026-06-19-myinvois-api-integration.md) for the MyInvois auth/endpoints.

## The obligation rules (deterministic, with evidence)

These are the mappings the rules engine encodes. **⚠verify** marks current-year figures to reconcile against LHDN/RMCD before production.

### Corporate income tax — Form C + CP204

- Every company files **Form C** annually; deadline is **7 months after financial year-end** (e.g., FYE 31 Dec 2025 → Form C due **31 Jul 2026**, with an e-Filing grace to 31 Aug 2026). Evidence: https://arnifi.com/blog/malaysia-form-c-corporate-tax-filing-2026/ , https://www.info-tech.com.my/blog/business-tax-deadline-malaysia-deadlines-rates-e-filing-guide/
- **CP204** tax estimate under **ITA 1967 s.107C**: submit **≥30 days before the beginning of the basis period**; **newly incorporated companies within 3 months of commencement**; monthly instalments due by the **15th** of each month; CP204 revisions in the 6th/9th month. Evidence: https://www.ajobthing.com/resources/blog/cp204-malaysia-deadline-calculation-download , https://www.gskassociates.net/post/guidelines-on-submission-of-tax-estimate-in-malaysia-via-form-cp204
- **SME relief:** a qualifying SME is **not required to furnish a CP204 estimate / instalments for the first 2 years of assessment** from commencement. Evidence: https://www.ajobthing.com/resources/blog/cp204-malaysia-deadline-calculation-download
- **SME rate band (YA2026, ⚠verify):** ~**15% on first RM150k, 17% on next RM450k, 24% on the balance**; non-SME flat 24%. SME = paid-up ≤ RM2.5m **and** gross income ≤ RM50m (⚠verify). Evidence: https://www.info-tech.com.my/blog/business-tax-deadline-malaysia-deadlines-rates-e-filing-guide/ , https://arnifi.com/blog/malaysia-form-c-corporate-tax-filing-2026/

### e-Invoicing (MyInvois) — by turnover phase

- Phase 1 **>RM100m** (1 Aug 2024); Phase 2 **RM25–100m** (1 Jan 2025); Phase 3 **RM5–25m** (1 Jul 2025); Phase 4 **RM1–5m** (1 Jan 2026). **Exemption threshold raised to RM1,000,000 from 1 Jan 2026; the final RM150k–500k phase was cancelled** → sub-RM1m is voluntary. Evidence: https://www.cleartax.com/my/en/different-phases-implementation-timelines-einvoicing-malaysia , https://sovos.com/regulatory-updates/vat/malaysia-mandatory-e-invoicing-exemption-threshold-increased/ , https://www.vatupdate.com/2025/12/17/malaysia-raises-e-invoicing-exemption-threshold-to-rm1-million-cancels-final-implementation-phase/

### SST — SST-02

- Sales & Service Tax; registration thresholds (~RM500k, category-dependent ⚠verify) and scope expanded across 2024–2025; **SST-02** returns bi-monthly. Status verifiable via MySST. Evidence: https://mysst.customs.gov.my/ , https://www.cleartax.com/my/en/sst-in-malaysia

### Employer, withholding, CGT, stamp duty, TP (⚠verify each)

- **Employer:** MTD/PCB monthly (CP39 data), Form E annual + EA forms, EPF/SOCSO/EIS — triggered by having employees.
- **Withholding tax (CP37):** on payments to non-residents (royalty/interest/technical/contract), within 1 month.
- **CGT:** companies disposing unlisted shares / certain foreign capital assets from 2024.
- **Stamp duty:** on chargeable instruments. **Transfer pricing:** contemporaneous documentation above related-party thresholds.
  Evidence (structural): LHDN https://www.hasil.gov.my/en/ (confirm each rate/threshold/deadline before production).

## developer.data.gov.my — reference only (corroborated)

The API is real and well-documented (base `https://api.data.gov.my`, no auth, **4 req/min**, `GET /data-catalogue?id=<slug>`, generic filters, `meta=true` envelope; the `datagovmy-meta` GitHub repo is the cleanest machine-readable catalogue). Evidence: https://developer.data.gov.my/quickstart , https://developer.data.gov.my/rate-limit , https://developer.data.gov.my/static-api/data-catalogue , https://github.com/data-gov-my/datagovmy-meta/tree/main/data-catalogue . **But it publishes statistics/aggregates, not authoritative rule content** — the identical conclusion the Layak team reached for welfare schemes (`2026-05-12-data-gov-my-evaluation.md`: "NOT USEFUL FOR DISCOVERY … not authoritative scheme rules"). For CukaiPandai it is therefore a **reference layer** (MSIC lookups, public-holiday calendars for deadline shifting, DOSM ratios for audit-risk baselines), not the obligation source.

## Fitness assessment for CukaiPandai

- **Obligation derivation: feasible** — the four-source profile + rules engine is the correct architecture; the hard, defensible IP is the **deterministic rules engine + the MyInvois-derived turnover signal**, not any single API.
- **Turnover signal: MyInvois is the unlock** — it is the only structured, authoritative, near-real-time transaction source that yields turnover (→ phase/SME/SST thresholds) and doubles as audit evidence.
- **SSM/MySST: real but gated** — SSM is paid/licensed; MySST has no rich API. Mock/seed for the hackathon; production needs the SSM CSD plan + customer SST numbers.
- **data.gov.my: keep as reference**, never as the obligation source or a user-facing rule citation.

## Recommended architecture

1. **Profiler agent** assembles the Entity Tax Profile (SSM + MyInvois + MySST + uploads).
2. **Deterministic Obligation Rules Engine** (versioned YAML/JSON config keyed to YA) maps profile → Obligation Calendar; deadlines holiday-shifted via data.gov.my.
3. Every obligation carries a `rule_id` + `config_version` for auditability; every figure traces to a source document. (See [trd.md](../../trd.md) §3, §5.)

## Open questions / gaps

- Exact YA2026 SME band split (RM450k vs RM400k tier) and SME qualifying thresholds — ⚠verify against LHDN.
- SST registration thresholds by service category (2025 expansion) — ⚠verify RMCD.
- SSM CSD API field list + commercial terms — confirm with SSM/MYDATA.
- Could not capture live MySST programmatic status (lookup is UI-oriented) — treat as customer-provided in MVP.

## References

- https://www.hasil.gov.my/en/ · https://sdk.myinvois.hasil.gov.my/ · https://www.ssm-einfo.my/ · https://mydata-ssm.my/ · https://mysst.customs.gov.my/ · https://sst01.customs.gov.my/account/inquiry
- https://developer.data.gov.my/ · https://developer.data.gov.my/quickstart · https://developer.data.gov.my/rate-limit · https://developer.data.gov.my/static-api/data-catalogue · https://github.com/data-gov-my/datagovmy-meta/tree/main/data-catalogue
- https://www.cleartax.com/my/en/different-phases-implementation-timelines-einvoicing-malaysia · https://sovos.com/regulatory-updates/vat/malaysia-mandatory-e-invoicing-exemption-threshold-increased/ · https://www.vatupdate.com/2025/12/17/malaysia-raises-e-invoicing-exemption-threshold-to-rm1-million-cancels-final-implementation-phase/
- https://www.info-tech.com.my/blog/business-tax-deadline-malaysia-deadlines-rates-e-filing-guide/ · https://arnifi.com/blog/malaysia-form-c-corporate-tax-filing-2026/ · https://www.ajobthing.com/resources/blog/cp204-malaysia-deadline-calculation-download · https://www.gskassociates.net/post/guidelines-on-submission-of-tax-estimate-in-malaysia-via-form-cp204 · https://www.cleartax.com/my/en/sst-in-malaysia
