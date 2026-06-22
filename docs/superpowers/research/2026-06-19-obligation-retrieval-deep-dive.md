# Deep Inspection — Retrieving an Enterprise's Tax Obligations

## TL;DR
There is **no single endpoint that returns "Company X's tax obligations."** You **assemble an Entity Tax Profile** from four retrieval channels and **derive** the obligation set with the rules engine:
1. **SSM company profile** → entity type, **MSIC** activity, **paid-up capital**, status, financials — via an **authorised SSM data provider API** (only ~4 exist; e.g. **Infomina**) or aggregators like **CTOS**.
2. **LHDN MyInvois** → **TIN validation** + transaction **search** ⇒ derive **turnover** (and a transaction ledger that doubles as audit evidence).
3. **RMCD MySST** → **SST registration status**.
4. **Internal/uploaded** → payroll (employees), AP (foreign payments), disposals, related-party txns.

Then `Entity Tax Profile → Obligation Rules Engine → Obligation Calendar`. SSM/CTOS are paid+licensed; MyInvois is OAuth2; MySST has no rich API. This is the answer to "how do we know what each enterprise owes."

## Channel 1 — SSM company profile (the entity backbone)
- SSM exposes company/business profiles through **authorised service-provider portals + APIs**: **SSM e-Info**, **MYDATA-SSM**, **SSM Search**, **SSM SAFEDATA**, and a **Corporate Subscription Data (CSD)** plan for "real-time data retrieval and auto-population through API integration." Evidence: https://www.ssm-einfo.my/ · https://www.mydata-ssm.com.my/ · https://www.ssm.com.my/Pages/Product/Company-Information.aspx
- A profile yields: company name, number, incorporation date, **type**, **status**, registered/business address, **nature of business (MSIC)**, **share capital (paid-up)**, directors, shareholders, charges, and **financial information**. Evidence: https://www.ssm.com.my/Pages/Product/Company-Information.aspx · https://www.ktp.com.my/blog/how-to-buy-company-information-from-ssm/10may2022
- **Access is gated:** SSM data is distributed only through **authorised providers** (there are ~4). Programmatic, real-time access = the CSD API or an authorised reseller. Evidence: https://theedgemalaysia.com/node/759661 · https://asiaverify.com/resources/guides/how-to-verify-a-company-in-malaysia-full-guide/
- → Populates `entity_type`, `msic_codes`, `paid_up_capital`, `status` (and a financials fallback for gross income if MyInvois is unavailable).

## Channel 2 — CTOS / credit bureaus (fastest commercial SSM-data API)
- **CTOS** partnered with **Infomina** (one of the **four authorised SSM data providers**) for **real-time SSM corporate data via direct API** — a pragmatic, affordable production path to company profiles + financials without becoming an SSM provider yourself. Evidence: https://theedgemalaysia.com/node/759661
- CTOS company reports include SSM profile, directorship, shareholding, charges, financial statements, address records (Section B). Evidence: https://ctoscredit.com.my/how-to-read-ctos-report-company/ · https://businessreport.ctoscredit.com.my/oneoffreport_api/single-report/malaysia-company/0247651H/CTOS-DATA-SYSTEMS-SDN-BHD-
- Alternatives: **Experian Malaysia**, **Credit Bureau Malaysia**, **MYEG** (MYDATA-SSM reseller). Evidence: https://buy.experian.com.my/ · https://www.myeg.com.my/services/ssm
- **Recommended production path for CukaiPandai:** integrate **CTOS/Infomina API** for the SSM profile (entity + MSIC + paid-up + financials) — least friction vs the raw CSD onboarding.

## Channel 3 — LHDN MyInvois (TIN + turnover + evidence)
- **TIN validation API** confirms a taxpayer's TIN (identity anchor). **Search Documents** returns issued/received e-invoices (last 31 days per call) → aggregate to **turnover** (→ e-invoice phase, SME test, SST threshold) and a **transaction ledger** that seeds the Evidence Vault. OAuth 2.0 (client credentials; TIN + NRIC/BRN); sandbox (preprod) + prod. Evidence: https://sdk.myinvois.hasil.gov.my/ · https://www.hasil.gov.my/en/e-invoice/reference-for-the-implementation-of-e-invoice/e-invoice-software-development-kit-sdk/
- **No public API** returns "which taxes is this TIN registered for" — registration status for income tax/SST/employer is **not** a single queryable field; it's **derived** from the profile + thresholds + the firm's own data.

## Channel 4 — RMCD MySST + internal data
- **MySST** provides an SST **registration-status lookup** (by name/registration number) — no rich API; capture the SST number at onboarding or check the portal. Evidence: https://mysst.customs.gov.my/
- **Internal/uploaded:** payroll/HR (employee_count → MTD/PCB, Form E/EA, EPF/SOCSO/EIS), AP (foreign payments → WHT), fixed-asset & share-disposal records (CGT), related-party transactions (TP). These are **never externally retrievable** — they come from the customer's systems/uploads.

## Reference layer — developer.data.gov.my
`api.data.gov.my` (no auth, 4 req/min): **MSIC** reference, **public-holiday** calendar (deadline shifting), DOSM industry ratios (audit-risk baselines). **Not** an obligation source. Evidence: https://developer.data.gov.my/ · https://developer.data.gov.my/static-api/data-catalogue

## The derivation (profile → obligations)
Implemented deterministically in `core/obligations.py` (+ `deadlines.py`, config `ya_2026.yaml`):
- company ⇒ Form C + CP204 (rate band from SME test on paid-up + gross).
- turnover ≥ phase threshold ⇒ e-invoice (≥RM1m mandated 2026).
- SST-registered ⇒ SST-02. · employees>0 ⇒ MTD/PCB + Form E/EA.
- foreign payments ⇒ WHT (CP37). · unlisted-share disposals (from 1 Mar 2024) ⇒ CGT. · related-party > thresholds ⇒ TP docs.

## Practical onboarding pipeline (production)
```
TIN / BRN
   │
   ├─► CTOS/Infomina API (or SSM CSD)  ──► entity_type, MSIC, paid_up_capital, financials
   ├─► MyInvois API (OAuth2)           ──► TIN validate + Search Documents ⇒ turnover + ledger(evidence)
   ├─► MySST lookup                    ──► SST registration status
   └─► Customer uploads/HRIS/AP        ──► employees, foreign payments, disposals, related-party
                         │
                         ▼
              Entity Tax Profile  ──►  Obligation Rules Engine (core)  ──►  Obligation Calendar
```

## Auth / cost / constraints
- **SSM CSD / CTOS:** paid + licensed; must go through one of the ~4 authorised SSM providers (CTOS/Infomina is the simplest API). 
- **MyInvois:** OAuth2 client credentials tied to the taxpayer's TIN; sandbox available; live needs the client's authorisation.
- **MySST:** no programmatic API of note → customer-provided SST number or portal check.
- **Hard truth:** "registered tax types" is not a queryable government field → **derivation is mandatory**, which is exactly CukaiPandai's defensible IP.

## Recommendation for CukaiPandai
- **MVP:** mock SSM/MySST (seeded `entity_acme.json`), MyInvois fixtures, customer-uploaded financials → engine. (Already built in `core` + `api`.)
- **Production:** integrate **CTOS/Infomina** for SSM profile + **MyInvois** (sandbox → prod) for turnover/evidence; capture SST number at onboarding; keep all obligation logic in the deterministic rules engine.

## Open / to confirm
- SSM **CSD pricing** + the exact list of the 4 authorised providers; **CTOS API** commercial terms + fields returned.
- **MyInvois** TIN-validation + Search exact endpoint paths/quotas (sdk.myinvois.hasil.gov.my/api).
- Whether **MyTax** offers any partner/agent API for registration status (currently assumed none → derive).

## References (URLs inline above)
SSM e-Info · MYDATA-SSM · SSM Company-Information · ktp blog · AsiaVerify KYB · The Edge (CTOS–Infomina) · CTOS report guide/API · Experian MY · MYEG · MyInvois SDK · LHDN e-Invoice SDK page · MySST · developer.data.gov.my.
