// FM-2 — /filing/new: one-shot Form C creation pipeline.
// Pipeline: Line Items → Compute Form C → Risk Assessment → Finalized (no Human Approval).
// Manual entry is STRUCTURED: pick a group, then an account from the fixed taxonomy, then the amount.
// This is deterministic (no AI) — only valid tax accounts can be entered, so gibberish is impossible.
// Uploading a financial document (Income Statement / Trial Balance) instead uses the AI to extract +
// classify the figures into the same taxonomy. On compute: auto-save (upgrade draft) → /filing/[id].

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import {
  type ClassifyResponse,
  type FormCResponse,
  type LineItem,
  createDraftFiling,
  getFiling,
  getFormC,
  saveFiling,
  upgradeFiling,
  uploadDocument
} from '../api/client'
import type { SsmProfile } from '../api/client'
import {
  ComputationPanel,
  RiskFlagList,
  type Stage,
  Stage1Detail,
  type StageId,
  StageRow,
  type StageStatus,
  TechnicalDetailsDisclosure
} from '../components/FilingPipeline'
import { SkeletonCard } from '../components/Skeleton'
import { InfoTip } from '../components/Tooltip'
import { useEntity } from '../hooks/useEntity'
import { CATEGORY_LABEL, TAX_GROUPS, accountByCode, accountsInGroup } from '../lib/taxAccounts'
import { useNotifications } from '../notifications'
import { isEntityIncomplete } from '../personas'

// Sentinel "model" for deterministically-entered line items (no LLM was involved).
const MANUAL_MODEL = 'structured-entry'

// Per-persona sample financial statements shipped in /public/fixtures (generated, taxonomy-aligned).
// Lets a demo user try the upload pipeline with a realistic document for their own company.
// Each persona has per-doc-type samples; fall back gracefully if only one type is available.
type DocType = 'income-statement' | 'trial-balance'

const SAMPLE_DOCS: Record<string, Partial<Record<DocType, { file: string; label: string }>>> = {
  C2581234509: {
    'income-statement': { file: 'acme-income-statement.pdf', label: 'Acme Trading — Income Statement' },
    'trial-balance': { file: 'acme-trial-balance.csv', label: 'Acme Trading — Trial Balance' }
  },
  C7654321098: {
    'income-statement': { file: 'sinar-income-statement.pdf', label: 'Sinar Digital — Statement of Profit or Loss' },
    'trial-balance': { file: 'sinar-trial-balance.csv', label: 'Sinar Digital — Trial Balance' }
  },
  C3219876540: {
    'income-statement': { file: 'selera-income-statement.pdf', label: 'Selera Kita — Statement of Profit or Loss' },
    'trial-balance': { file: 'selera-trial-balance.csv', label: 'Selera Kita — Trial Balance' }
  }
}

const DOC_TYPE_META: Record<DocType, { label: string; caption: string; dropCopy: string; formats: string }> = {
  'income-statement': {
    label: 'Income Statement / P&L',
    caption: 'revenue & expense lines',
    dropCopy: 'Drop your Income Statement (P&L)',
    formats: 'CSV, XLSX, or PDF'
  },
  'trial-balance': {
    label: 'Trial Balance',
    caption: 'all ledger account balances',
    dropCopy: 'Drop your Trial Balance',
    formats: 'CSV, XLSX, or PDF'
  }
}

// Loaded-document descriptor: either an uploaded File or a fixture sample path.
interface LoadedDoc {
  id: string
  name: string
  docType: DocType
  // For uploaded files: an object URL (revoke on remove/unmount); for samples: the fixture path.
  previewSrc: string
  isSample: boolean
  mimeType: string
}

let _docSeq = 0
function docId(): string {
  _docSeq += 1
  return `d${_docSeq}`
}

function buildSsm(entity: {
  tin: string
  entity_type: string
  msic_codes: string[]
  paid_up_capital: number
  gross_income: number
  employee_count: number
  sst_registered: boolean
  basis_period_start: string
  basis_period_end: string
  commencement_date?: string
}): SsmProfile {
  return {
    tin: entity.tin,
    entity_type: entity.entity_type,
    msic_codes: entity.msic_codes,
    paid_up_capital: entity.paid_up_capital,
    gross_income: entity.gross_income,
    employee_count: entity.employee_count,
    sst_registered: entity.sst_registered,
    basis_period_start: entity.basis_period_start,
    basis_period_end: entity.basis_period_end,
    commencement_date: entity.commencement_date
  }
}

// --- Structured line-item rows ---
interface Row {
  key: string
  group: string
  code: string
  amount: string
}

let _rowSeq = 0
function rid(): string {
  _rowSeq += 1
  return `r${_rowSeq}`
}

function blankRow(): Row {
  return { key: rid(), group: '', code: '', amount: '' }
}

function rowsFromItems(items: { code: string; amount: number }[]): Row[] {
  const rows = items
    .map((it) => {
      const acct = accountByCode(it.code)
      if (!acct) return null
      return { key: rid(), group: acct.group, code: it.code, amount: String(it.amount) }
    })
    .filter((r): r is Row => r !== null)
  return rows.length > 0 ? rows : [blankRow()]
}

function seedRows(persona: { demoItems?: { code: string; amount: number }[] }): Row[] {
  return rowsFromItems(persona.demoItems ?? [])
}

/** Build deterministic LineItems from the structured rows (category comes from the taxonomy). */
function buildLineItems(rows: Row[]): LineItem[] {
  const items: LineItem[] = []
  for (const r of rows) {
    const acct = accountByCode(r.code)
    const amount = Number(r.amount)
    if (!acct || !r.amount.trim() || !Number.isFinite(amount) || amount <= 0) continue
    items.push({ code: acct.code, description: acct.label, amount, category: acct.category })
  }
  return items
}

// One-shot pipeline phases (no Human Approval)
type Phase =
  | { tag: 'idle' }
  | { tag: 'classifying' }
  | { tag: 'classified' }
  | { tag: 'computing' }
  | { tag: 'done'; result: FormCResponse }
  | { tag: 'error'; message: string }

function deriveStages(phase: Phase, classifyResult: ClassifyResponse | null): Stage[] {
  const base: Stage[] = [
    { id: 'classify' as StageId, num: 1, name: 'Line Items', status: 'pending' as StageStatus },
    { id: 'compute' as StageId, num: 2, name: 'Compute Form C', status: 'pending' as StageStatus },
    { id: 'risk' as StageId, num: 3, name: 'Risk Assessment', status: 'pending' as StageStatus },
    { id: 'finalized' as StageId, num: 4, name: 'Finalized', status: 'pending' as StageStatus }
  ]

  if (phase.tag === 'idle') return base

  if (phase.tag === 'classifying') {
    base[0].status = 'running'
    return base
  }

  if (phase.tag === 'classified' && classifyResult) {
    const n = classifyResult.line_items.length
    base[0].status = 'complete'
    base[0].writeBack = `${n} line item${n !== 1 ? 's' : ''} ready`
    return base
  }

  if (phase.tag === 'computing') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `${n} line item${n !== 1 ? 's' : ''} ready`
    base[1].status = 'running'
    return base
  }

  if (phase.tag === 'done') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `${n} line item${n !== 1 ? 's' : ''} ready`
    const comp = phase.result.computation
    const taxPayable = comp.fields.tax_payable?.value
    const chargeableIncome = comp.fields.chargeable_income?.value
    base[1].status = 'complete'
    base[1].writeBack =
      chargeableIncome != null && taxPayable != null
        ? `Chargeable income RM ${chargeableIncome.toLocaleString('en-MY')}, tax payable RM ${taxPayable.toLocaleString('en-MY')}`
        : 'Form C computation complete'
    const flags = phase.result.risk_flags
    const high = flags.filter((f) => f.severity === 'high').length
    const medium = flags.filter((f) => f.severity === 'medium').length
    const low = flags.filter((f) => f.severity === 'low').length
    const parts: string[] = []
    if (high > 0) parts.push(`${high} high`)
    if (medium > 0) parts.push(`${medium} medium`)
    if (low > 0) parts.push(`${low} low`)
    base[2].status = 'complete'
    base[2].writeBack =
      parts.length > 0
        ? `${parts.join(', ')} risk flag${flags.length !== 1 ? 's' : ''} detected`
        : 'No risk flags detected'
    base[3].status = 'complete'
    base[3].writeBack = 'Ready to save'
    return base
  }

  if (phase.tag === 'error') {
    for (const s of base) {
      if (s.status === 'pending') {
        s.status = 'error'
        break
      }
    }
  }

  return base
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  padding: '7px 8px',
  background: 'var(--screen)',
  border: 'var(--border)',
  borderRadius: 'var(--radius)',
  color: 'var(--ink)',
  width: '100%'
}

export default function FilingNew() {
  const { persona } = useActivePersona()
  const { entity, error: entityError, loading: entityLoading } = useEntity()
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState<Row[]>(() => seedRows(persona))
  const [classifyResult, setClassifyResult] = useState<ClassifyResponse | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [aiClassified, setAiClassified] = useState(false)
  const [phase, setPhase] = useState<Phase>({ tag: 'idle' })
  const [latestResult, setLatestResult] = useState<FormCResponse | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [docType, setDocType] = useState<DocType | null>(null)
  // pendingDocs: the list of documents staged for extraction (not yet classified).
  const [pendingDocs, setPendingDocs] = useState<LoadedDoc[]>([])
  // loadedDoc: the single document used as source for the AI classification (set after extraction).
  const [loadedDoc, setLoadedDoc] = useState<LoadedDoc | null>(null)
  // Keep a ref to pending docs so unmount cleanup can revoke object URLs without a stale closure.
  const pendingDocsRef = useRef<LoadedDoc[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notify } = useNotifications()
  const navigate = useNavigate()

  // Resume a draft: rehydrate the structured rows from the stored line_items so the user lands on
  // the editable form (and the "classified" stage if items exist) and can edit then re-compute.
  const resumeId = searchParams.get('resume')
  useEffect(() => {
    if (!resumeId) return
    getFiling(resumeId)
      .then((rec) => {
        if (rec.status !== 'draft') return
        setDraftId(rec.id)
        if (rec.line_items && rec.line_items.length > 0) {
          setRows(rowsFromItems(rec.line_items))
          setClassifyResult({ line_items: rec.line_items, sovereign: true, active_model: MANUAL_MODEL })
          setLineItems(rec.line_items)
          setAiClassified(false)
          setPhase({ tag: 'classified' })
        }
      })
      .catch(() => {
        // Silently ignore — a missing draft just starts fresh
      })
  }, [resumeId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona switches
  useEffect(() => {
    setRows(seedRows(persona))
    setClassifyResult(null)
    setLineItems([])
    setAiClassified(false)
    setPhase({ tag: 'idle' })
    setLatestResult(null)
    setDraftId(null)
    // Revoke object URLs for any uploaded (non-sample) pending docs before clearing
    for (const d of pendingDocsRef.current) {
      if (!d.isSample) URL.revokeObjectURL(d.previewSrc)
    }
    pendingDocsRef.current = []
    setPendingDocs([])
    setLoadedDoc(null)
    setDocType(null)
  }, [persona.tin])

  // Revoke object URLs for pending docs on unmount.
  useEffect(() => {
    return () => {
      for (const d of pendingDocsRef.current) {
        if (!d.isSample) URL.revokeObjectURL(d.previewSrc)
      }
    }
  }, [])

  const stages = deriveStages(phase, classifyResult)
  const activeStageId: StageId | null =
    phase.tag === 'idle' || phase.tag === 'error'
      ? null
      : phase.tag === 'classifying'
        ? 'classify'
        : phase.tag === 'classified'
          ? 'classify'
          : phase.tag === 'computing'
            ? 'compute'
            : phase.tag === 'done'
              ? 'finalized'
              : null

  const entityEmpty = entity ? isEntityIncomplete(entity) : false
  const displayError = entityError ?? (phase.tag === 'error' ? phase.message : null)
  const isLoading = entityLoading || phase.tag === 'classifying' || phase.tag === 'computing'
  const validItems = buildLineItems(rows)

  if (!entityLoading && entityEmpty) {
    return (
      <>
        <div className="page-head">
          <h1>New Filing</h1>
          <p className="page-kicker">Enter your line items and compute a cited Form C.</p>
        </div>
        <div className="window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Set Up Your Company</span>
          </div>
          <div
            style={{
              padding: '20px 18px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--ink-soft)',
              lineHeight: 1.7
            }}
          >
            Set up your company to see this. Add your details in the Entity page.
          </div>
          <div style={{ padding: '0 18px 18px' }}>
            <Link
              to="/entity"
              style={{
                display: 'inline-block',
                padding: '8px 20px',
                background: 'var(--denim)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                borderRadius: 'var(--radius)'
              }}
            >
              Go to Entity Page
            </Link>
          </div>
        </div>
      </>
    )
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function handleManualSubmit() {
    if (!entity) return
    const items = buildLineItems(rows)
    if (items.length === 0) return
    setUploadError(null)
    const result: ClassifyResponse = { line_items: items, sovereign: true, active_model: MANUAL_MODEL }
    setClassifyResult(result)
    setLineItems(items)
    setAiClassified(false)
    setPhase({ tag: 'classified' })
    // Persist a draft (best-effort: a transient BE error must not block the UI). Reuse the existing
    // draft id if we already have one (edit -> re-submit) so we keep ONE record.
    const label = `${persona.label} · Form C ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}`
    void (async () => {
      try {
        if (draftId) {
          await upgradeFiling(draftId, { line_items: items, status: 'draft', label })
        } else {
          const draft = await createDraftFiling({ tin: entity.tin, label, line_items: items })
          setDraftId(draft.id)
        }
      } catch {
        // Silently ignore — draft persistence failure does not block the flow
      }
    })()
  }

  // Add a document to the pending list (does NOT start classification).
  function addPendingDoc(doc: LoadedDoc) {
    pendingDocsRef.current = [...pendingDocsRef.current, doc]
    setPendingDocs(pendingDocsRef.current)
  }

  function removePendingDoc(id: string) {
    const removed = pendingDocsRef.current.find((d) => d.id === id)
    if (removed && !removed.isSample) URL.revokeObjectURL(removed.previewSrc)
    pendingDocsRef.current = pendingDocsRef.current.filter((d) => d.id !== id)
    setPendingDocs(pendingDocsRef.current)
  }

  function handleAddFile(file: File) {
    const allowed = ['.csv', '.xlsx', '.pdf']
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowed.includes(ext)) {
      setUploadError(`Unsupported file type "${ext}". Upload a CSV, XLSX, or PDF financial statement.`)
      return
    }
    setUploadError(null)
    const effectiveDocType = docType ?? 'income-statement'
    const objUrl = URL.createObjectURL(file)
    addPendingDoc({
      id: docId(),
      name: file.name,
      docType: effectiveDocType,
      previewSrc: objUrl,
      isSample: false,
      mimeType: file.type
    })
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleAddFile(file)
  }

  async function handleUseSample() {
    if (!entity) return
    const personaSamples = SAMPLE_DOCS[entity.tin]
    if (!personaSamples) return
    const effectiveType: DocType = docType ?? 'income-statement'
    const sample = personaSamples[effectiveType] ?? Object.values(personaSamples)[0]
    if (!sample) return
    setUploadError(null)
    try {
      const fixturePath = `/fixtures/${sample.file}`
      const mime = sample.file.endsWith('.csv')
        ? 'text/csv'
        : sample.file.endsWith('.xlsx')
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      addPendingDoc({
        id: docId(),
        name: sample.file,
        docType: effectiveType,
        previewSrc: fixturePath,
        isSample: true,
        mimeType: mime
      })
    } catch (e) {
      setUploadError(`Could not add sample document: ${(e as Error).message}`)
    }
  }

  // Extract figures: classify the first (primary) pending document, leave others listed.
  async function handleExtract() {
    if (!entity || pendingDocs.length === 0) return
    const primary = pendingDocs[0]
    setUploadError(null)
    setPhase({ tag: 'classifying' })
    try {
      // Fetch the file bytes from the previewSrc (object URL or fixture path).
      const res = await fetch(primary.previewSrc)
      if (!res.ok) throw new Error(`could not load document (${res.status})`)
      const blob = await res.blob()
      const file = new File([blob], primary.name, { type: primary.mimeType })
      const result = await uploadDocument(entity.tin, file, entity)
      setRows(rowsFromItems(result.line_items))
      setClassifyResult(result)
      setLineItems(result.line_items)
      setAiClassified(true)
      setPhase({ tag: 'classified' })
      setLoadedDoc(primary)
      notify({
        title: 'Document Classified',
        body: `${primary.name} mapped to ${result.line_items.length} line items.`,
        kind: 'success'
      })
      const label = `${persona.label} · Form C ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}`
      try {
        const draft = await createDraftFiling({ tin: entity.tin, label, line_items: result.line_items })
        setDraftId(draft.id)
      } catch {
        // Silently ignore
      }
    } catch (e) {
      const msg = (e as Error).message
      setUploadError(`Extraction failed: ${msg}. Enter the line items manually above instead.`)
      setPhase({ tag: 'idle' })
    }
  }

  async function handleCompute() {
    if (!entity || !classifyResult) return
    setPhase({ tag: 'computing' })
    try {
      const ssm = buildSsm(entity)
      const result = await getFormC(entity.tin, ssm, lineItems)
      setLatestResult(result)
      setPhase({ tag: 'done', result })
      // Auto-save: upgrade the draft to final (or create a final record if no draft was created)
      const label = `${persona.label} · Form C ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}`
      try {
        let targetId = draftId
        if (targetId) {
          await upgradeFiling(targetId, {
            computation: result.computation,
            risk_flags: result.risk_flags,
            line_items: lineItems,
            status: 'final',
            label
          })
        } else {
          const rec = await saveFiling({
            tin: entity.tin,
            label,
            computation: result.computation,
            risk_flags: result.risk_flags,
            line_items: lineItems
          })
          targetId = rec.id
        }
        notify({ title: 'Filing Saved', body: `${label} saved.`, kind: 'success' })
        navigate(`/filing/${targetId}`)
      } catch (saveErr) {
        notify({ title: 'Auto-Save Failed', body: (saveErr as Error).message, kind: 'warning' })
      }
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
  }

  function handleEditItems() {
    // Return to the editable form, preserving the rows + the draft id so the same record is reused.
    setPhase({ tag: 'idle' })
    setClassifyResult(null)
    setLineItems([])
  }

  return (
    <>
      <div className="page-head">
        <h1>New Filing</h1>
        <p className="page-kicker">
          Add your line items, then compute a cited Form C with the deterministic core. Form C · YA2026 ·{' '}
          {entity?.tin ?? '...'}
        </p>
      </div>

      {displayError && (
        <div className="window error-window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{displayError}</div>
        </div>
      )}

      {/* Skeleton while entity profile loads */}
      {entityLoading && (
        <div style={{ display: 'grid', gap: 16, marginTop: 16 }} aria-label="Loading filing form">
          <SkeletonCard titleWidth="50%" bodyLines={3} />
          <SkeletonCard titleWidth="40%" bodyLines={4} />
        </div>
      )}

      {/* Stage 1: structured line-item entry */}
      {!entityLoading && entity && (phase.tag === 'idle' || phase.tag === 'error') && (
        <>
          {/* Breadcrumb — just above the Stage 01 card (mirrors FilingRecord placement) */}
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <Link
              to="/filing"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-soft)',
                textDecoration: 'none'
              }}
            >
              &larr; Back to Filing Records
            </Link>
          </div>
          <div className="window">
            <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="titlebar-title">Stage 01 - Provide Your Figures</span>
              <InfoTip content="Upload a financial document (Income Statement / P&L or Trial Balance) and AI extracts + maps the figures to the fixed tax accounts, or switch to Manual Entry to pick the accounts yourself. Manual entry is deterministic -- no AI -- and only valid tax accounts can be added, so there is no free-text guessing." />
              <span className="titlebar-meta">upload or enter</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
              {/* Document-first tab toggle */}
              <div
                role="tablist"
                aria-label="Input mode"
                style={{ display: 'flex', gap: 4, borderBottom: 'var(--border)' }}
              >
                {(
                  [
                    ['upload', 'Upload Document'],
                    ['manual', 'Manual Entry']
                  ] as const
                ).map(([m, lbl]) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    style={{
                      appearance: 'none',
                      border: 'none',
                      background: 'transparent',
                      padding: '8px 14px',
                      marginBottom: -1,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: mode === m ? 700 : 500,
                      color: mode === m ? 'var(--ink)' : 'var(--ink-soft)',
                      borderBottom: mode === m ? '2px solid var(--denim)' : '2px solid transparent'
                    }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Manual entry panel */}
              <div style={{ display: mode === 'manual' ? 'grid' : 'none', gap: 14 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--ink)',
                    fontWeight: 600
                  }}
                >
                  Add each account from your trial balance or P&amp;L
                </div>

                {/* Column headings */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1.7fr) 130px 30px',
                    gap: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--ink-soft)'
                  }}
                >
                  <span>Category group</span>
                  <span>Account</span>
                  <span>Amount (RM)</span>
                  <span />
                </div>

                {/* Rows */}
                <div style={{ display: 'grid', gap: 10 }}>
                  {rows.map((r) => {
                    const acct = r.code ? accountByCode(r.code) : undefined
                    return (
                      <div key={r.key} style={{ display: 'grid', gap: 4 }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1.7fr) 130px 30px',
                            gap: 8,
                            alignItems: 'center'
                          }}
                        >
                          <select
                            value={r.group}
                            onChange={(e) => updateRow(r.key, { group: e.target.value, code: '' })}
                            style={selectStyle}
                          >
                            <option value="">Group…</option>
                            {TAX_GROUPS.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          <select
                            value={r.code}
                            onChange={(e) => updateRow(r.key, { code: e.target.value })}
                            disabled={!r.group}
                            style={{ ...selectStyle, opacity: r.group ? 1 : 0.5 }}
                          >
                            <option value="">{r.group ? 'Account…' : 'Pick a group first'}</option>
                            {accountsInGroup(r.group).map((a) => (
                              <option key={a.code} value={a.code}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={r.amount}
                            onChange={(e) => updateRow(r.key, { amount: e.target.value })}
                            placeholder="0"
                            style={{ ...selectStyle, textAlign: 'right' }}
                          />
                          <button
                            type="button"
                            onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs))}
                            aria-label="Remove line item"
                            title="Remove line item"
                            style={{
                              border: 'var(--border)',
                              background: 'var(--window)',
                              color: 'var(--ink-soft)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 14,
                              lineHeight: 1,
                              height: 30,
                              cursor: 'pointer',
                              borderRadius: 'var(--radius)'
                            }}
                          >
                            ×
                          </button>
                        </div>
                        {acct && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2, minHeight: 16 }}>
                            <span className="kind-tag">{CATEGORY_LABEL[acct.category]}</span>
                            <InfoTip content={acct.note} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setRows((rs) => [...rs, blankRow()])}
                    style={{
                      padding: '7px 14px',
                      border: 'var(--border)',
                      background: 'var(--window)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    + Add line item
                  </button>
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={validItems.length === 0}
                    style={{
                      padding: '8px 20px',
                      border: 'var(--border)',
                      background: 'var(--denim)',
                      color: 'var(--paper)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: validItems.length === 0 ? 'not-allowed' : 'pointer',
                      borderRadius: 'var(--radius)',
                      opacity: validItems.length === 0 ? 0.5 : 1
                    }}
                  >
                    Continue
                  </button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                    {validItems.length} valid line item{validItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Upload panel (document-first / default) */}
              <div style={{ display: mode === 'upload' ? 'grid' : 'none', gap: 16 }}>
                {/* Step A: document-type picker */}
                <div style={{ display: 'grid', gap: 8 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--ink-soft)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}
                  >
                    Step 1 — Select document type
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {(['income-statement', 'trial-balance'] as DocType[]).map((dt) => {
                      const meta = DOC_TYPE_META[dt]
                      const selected = docType === dt
                      return (
                        <button
                          key={dt}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setDocType(dt)}
                          style={{
                            appearance: 'none',
                            padding: '12px 14px',
                            border: selected ? '2px solid var(--denim)' : 'var(--border)',
                            borderRadius: 'var(--radius)',
                            background: selected ? 'rgba(65,82,110,0.08)' : 'var(--screen)',
                            color: 'var(--ink)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'border-color 120ms, background 120ms'
                          }}
                        >
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              fontWeight: selected ? 700 : 500,
                              color: selected ? 'var(--denim)' : 'var(--ink)'
                            }}
                          >
                            {meta.label}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              color: 'var(--ink-soft)',
                              marginTop: 4
                            }}
                          >
                            {meta.caption}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Step B: tailored dropzone (shown once a type is picked) */}
                {docType && (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--ink-soft)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}
                    >
                      Step 2 — Add documents
                    </div>

                    {/* "Use sample document" button */}
                    {entity && SAMPLE_DOCS[entity.tin]?.[docType] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => void handleUseSample()}
                          style={{
                            padding: '7px 14px',
                            border: 'var(--border)',
                            background: 'var(--window)',
                            color: 'var(--ink)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            cursor: 'pointer',
                            borderRadius: 'var(--radius)'
                          }}
                        >
                          Use sample document
                        </button>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                          {SAMPLE_DOCS[entity.tin]?.[docType]?.label}
                        </span>
                      </div>
                    )}
                    {/* Fallback sample button when the selected type has no dedicated sample */}
                    {entity && SAMPLE_DOCS[entity.tin] && !SAMPLE_DOCS[entity.tin]?.[docType] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => void handleUseSample()}
                          style={{
                            padding: '7px 14px',
                            border: 'var(--border)',
                            background: 'var(--window)',
                            color: 'var(--ink)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            cursor: 'pointer',
                            borderRadius: 'var(--radius)'
                          }}
                        >
                          Use sample document
                        </button>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                          (another document type sample)
                        </span>
                      </div>
                    )}

                    {/* File drop zone */}
                    <button
                      type="button"
                      onDragOver={(e) => {
                        e.preventDefault()
                        setDragOver(true)
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: dragOver ? '2px dashed var(--denim)' : '2px dashed var(--grid)',
                        borderRadius: 'var(--radius)',
                        background: dragOver ? 'rgba(65,82,110,0.06)' : 'var(--screen)',
                        padding: '20px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 150ms, background 150ms',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: dragOver ? 'var(--denim)' : 'var(--ink-soft)'
                        }}
                      >
                        {DOC_TYPE_META[docType].dropCopy} · {DOC_TYPE_META[docType].formats}
                      </div>
                      <div
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 6 }}
                      >
                        Click to browse or drag and drop. Documents are added to the list below before extraction.
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleAddFile(file)
                          e.target.value = ''
                        }}
                      />
                    </button>

                    {/* Pending document list */}
                    {pendingDocs.length > 0 && (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {pendingDocs.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              border: 'var(--border)',
                              borderRadius: 'var(--radius)',
                              background: 'var(--screen)'
                            }}
                          >
                            {/* Doc icon */}
                            <svg
                              aria-hidden="true"
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              style={{ flexShrink: 0, color: 'var(--denim)' }}
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: 'var(--ink)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {doc.name}
                              </div>
                              <div
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 10,
                                  color: 'var(--ink-soft)',
                                  marginTop: 1
                                }}
                              >
                                {DOC_TYPE_META[doc.docType].label}
                                {doc.isSample ? ' · sample' : ''}
                              </div>
                            </div>
                            {/* Eye button — opens in new tab */}
                            <button
                              type="button"
                              aria-label="Preview document in new tab"
                              title="Preview in new tab"
                              onClick={() => window.open(doc.previewSrc, '_blank', 'noopener')}
                              style={{
                                border: 'var(--border)',
                                background: 'var(--window)',
                                color: 'var(--ink-soft)',
                                borderRadius: 'var(--radius)',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              <svg
                                aria-hidden="true"
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            {/* Delete button */}
                            <button
                              type="button"
                              aria-label={`Remove ${doc.name}`}
                              title="Remove document"
                              onClick={() => removePendingDoc(doc.id)}
                              style={{
                                border: 'var(--border)',
                                background: 'var(--window)',
                                color: 'var(--ink-soft)',
                                borderRadius: 'var(--radius)',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                fontFamily: 'var(--font-display)',
                                fontSize: 16,
                                lineHeight: 1
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Extract figures button — primary action, enabled when list is non-empty */}
                    <div>
                      <button
                        type="button"
                        onClick={() => void handleExtract()}
                        disabled={pendingDocs.length === 0}
                        style={{
                          padding: '8px 20px',
                          border: 'var(--border)',
                          background: pendingDocs.length > 0 ? 'var(--denim)' : 'var(--window)',
                          color: pendingDocs.length > 0 ? 'var(--paper)' : 'var(--ink-soft)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: pendingDocs.length === 0 ? 'not-allowed' : 'pointer',
                          borderRadius: 'var(--radius)',
                          opacity: pendingDocs.length === 0 ? 0.5 : 1
                        }}
                      >
                        Extract figures
                      </button>
                      {pendingDocs.length > 1 && (
                        <span
                          style={{
                            marginLeft: 10,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--ink-soft)'
                          }}
                        >
                          · primary document ({pendingDocs[0].name}) will be extracted
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--rust)',
                      padding: '8px 12px',
                      border: '1px solid var(--rust)',
                      borderRadius: 'var(--radius)',
                      background: 'rgba(181,80,60,0.04)'
                    }}
                  >
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pipeline stepper + detail panels */}
      {phase.tag !== 'idle' && !entityLoading && (
        <>
          {/* Pipeline card — shown while in progress; hidden in done (it moves under Computed) */}
          {phase.tag !== 'done' && (
            <div className="window" style={{ marginTop: 16 }}>
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Filing Pipeline</span>
                <InfoTip content="Line items come from your structured entries (deterministic) or from AI classification of an uploaded document. Steps 2-4 are performed entirely by the deterministic rule-based core -- no AI computes the tax figure." />
                {isLoading && <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />}
              </div>
              <div className="row-div-list">
                {stages.map((stage) => (
                  <StageRow key={stage.id} stage={stage} isActive={activeStageId === stage.id} />
                ))}
              </div>
            </div>
          )}

          {/* Stage 1 detail: line items */}
          {classifyResult && phase.tag !== 'classifying' && (
            <>
              {/* Persistent loaded-document row: visible on classified + computing stages so the user
                  can always see which document was the source and open the preview. AI path only. */}
              {aiClassified && loadedDoc && (phase.tag === 'classified' || phase.tag === 'computing') && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 12,
                    padding: '8px 12px',
                    border: 'var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--screen)'
                  }}
                >
                  <svg
                    aria-hidden="true"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    style={{ flexShrink: 0, color: 'var(--denim)' }}
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {loadedDoc.name}
                    </div>
                    <div
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}
                    >
                      {DOC_TYPE_META[loadedDoc.docType].label}
                      {loadedDoc.isSample ? ' · sample' : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Open source document in new tab"
                    title="Open in new tab"
                    onClick={() => window.open(loadedDoc.previewSrc, '_blank', 'noopener')}
                    style={{
                      border: 'var(--border)',
                      background: 'var(--window)',
                      color: 'var(--ink-soft)',
                      borderRadius: 'var(--radius)',
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    <svg
                      aria-hidden="true"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              )}

              <Stage1Detail classifyResult={classifyResult} lineItems={lineItems} manual={!aiClassified} />

              {/* Compute button -- shown once line items are ready, before computing */}
              {phase.tag === 'classified' && (
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => void handleCompute()}
                    style={{
                      padding: '8px 20px',
                      border: 'var(--border)',
                      background: 'var(--denim)',
                      color: 'var(--paper)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    Compute Form C
                  </button>
                  <button
                    type="button"
                    onClick={handleEditItems}
                    style={{
                      padding: '8px 16px',
                      border: 'var(--border)',
                      background: 'var(--window)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    Edit Line Items
                  </button>
                </div>
              )}
            </>
          )}

          {/* Stage 2+3 detail: computation + risk flags — auto-saved, reordered (FE-2.4) */}
          {phase.tag === 'done' && latestResult && (
            <>
              {/* Computed card (primary) — provenance in heading InfoTip */}
              <ComputationPanel
                computation={latestResult.computation}
                title="Stage 02-03 - Computed"
                headingTip={
                  aiClassified
                    ? 'The tax figure was computed by the deterministic, rule-based core -- not the AI. The AI only classified your uploaded document into line items; every figure then traces to a specific rule ID and config version. Expand technical details below to see the full per-figure trace.'
                    : 'The tax figure was computed entirely by the deterministic, rule-based core -- no AI was involved at any step. You entered the line items directly; every figure traces to a specific rule ID and config version. Expand technical details below to see the full per-figure trace.'
                }
              />

              {/* Risk assessment (if any) */}
              {latestResult.risk_flags.length > 0 && (
                <div className="window" style={{ marginTop: 12 }}>
                  <div className="titlebar">
                    <span className="titlebar-title">Risk Assessment</span>
                    <span className="titlebar-meta">
                      {latestResult.risk_flags.length} flag{latestResult.risk_flags.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    <RiskFlagList flags={latestResult.risk_flags} />
                  </div>
                </div>
              )}

              {/* Filing Pipeline card (moved here, under Computed, before technical details) */}
              <div className="window" style={{ marginTop: 12 }}>
                <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="titlebar-title">Filing Pipeline</span>
                  <InfoTip content="Line items come from your structured entries (deterministic) or from AI classification of an uploaded document. Steps 2-4 are performed entirely by the deterministic rule-based core -- no AI computes the tax figure." />
                </div>
                <div className="row-div-list">
                  {stages.map((stage) => (
                    <StageRow key={stage.id} stage={stage} isActive={activeStageId === stage.id} />
                  ))}
                </div>
                {/* Technical details disclosure (Route Info only shown for the AI upload path) */}
                <TechnicalDetailsDisclosure
                  computation={latestResult.computation}
                  classifyRouteInfo={aiClassified ? classifyResult : null}
                />
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
