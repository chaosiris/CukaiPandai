// FM-2 — /filing/new: one-shot Form C creation pipeline.
// Pipeline: Classify Line Items → Compute Form C → Risk Assessment → Finalized (no Human Approval).
// Guided input: trial-balance textarea (persona demoRawText pre-filled), CSV/XLSX/PDF as secondary.
// On finalize: saveFiling() → navigate to /filing/[id].
// "How this was calculated" provenance note: deterministic rule-based core, not the AI.

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useActivePersona } from '../PersonaContext'
import {
  type ClassifyResponse,
  type FormCResponse,
  type LineItem,
  classifyTrialBalance,
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
import { InfoTip } from '../components/Tooltip'
import { useEntity } from '../hooks/useEntity'
import { useNotifications } from '../notifications'
import { isEntityIncomplete } from '../personas'

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
    { id: 'classify' as StageId, num: 1, name: 'Classify Line Items', status: 'pending' as StageStatus },
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
    base[0].writeBack = `${n} line item${n !== 1 ? 's' : ''} classified`
    return base
  }

  if (phase.tag === 'computing') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `${n} line item${n !== 1 ? 's' : ''} classified`
    base[1].status = 'running'
    return base
  }

  if (phase.tag === 'done') {
    const n = classifyResult?.line_items.length ?? 0
    base[0].status = 'complete'
    base[0].writeBack = `${n} line item${n !== 1 ? 's' : ''} classified`
    const comp = phase.result.computation
    const taxPayable = comp.fields.tax_payable?.value
    const chargeableIncome = comp.fields.chargeable_income?.value
    base[1].status = 'complete'
    base[1].writeBack =
      chargeableIncome != null && taxPayable != null
        ? `Chargeable income RM ${chargeableIncome.toLocaleString()}, tax payable RM ${taxPayable.toLocaleString()}`
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

export default function FilingNew() {
  const { persona } = useActivePersona()
  const { entity, error: entityError, loading: entityLoading } = useEntity()
  const [searchParams] = useSearchParams()
  const [rawText, setRawText] = useState(persona.demoRawText)
  const [classifyResult, setClassifyResult] = useState<ClassifyResponse | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [phase, setPhase] = useState<Phase>({ tag: 'idle' })
  const [latestResult, setLatestResult] = useState<FormCResponse | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { notify } = useNotifications()
  const navigate = useNavigate()

  // Resume a draft: restore raw_text and set draftId so the user can re-classify or compute
  const resumeId = searchParams.get('resume')
  useEffect(() => {
    if (!resumeId) return
    getFiling(resumeId)
      .then((rec) => {
        if (rec.status === 'draft') {
          if (rec.raw_text) setRawText(rec.raw_text)
          setDraftId(rec.id)
        }
      })
      .catch(() => {
        // Silently ignore — a missing draft just starts fresh
      })
  }, [resumeId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona switches
  useEffect(() => {
    setRawText(persona.demoRawText)
    setClassifyResult(null)
    setLineItems([])
    setPhase({ tag: 'idle' })
    setLatestResult(null)
    setDraftId(null)
  }, [persona.tin])

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

  if (!entityLoading && entityEmpty) {
    return (
      <>
        <div className="page-head">
          <h1>New Filing</h1>
          <p className="page-kicker">Classify your trial balance and compute a cited Form C.</p>
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

  async function handleClassify() {
    if (!entity) return
    setUploadError(null)
    setPhase({ tag: 'classifying' })
    try {
      const result = await classifyTrialBalance(entity.tin, rawText, entity)
      setClassifyResult(result)
      setLineItems(result.line_items)
      setPhase({ tag: 'classified' })
      // Create draft record on classify (best-effort: a transient BE error must not block UI)
      const label = `${persona.label} · Form C ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}`
      try {
        const draft = await createDraftFiling({
          tin: entity.tin,
          label,
          line_items: result.line_items,
          raw_text: rawText
        })
        setDraftId(draft.id)
      } catch {
        // Silently ignore — draft creation failure does not block classify flow
      }
    } catch (e) {
      setPhase({ tag: 'error', message: (e as Error).message })
    }
  }

  async function handleUpload(file: File) {
    if (!entity) return
    const allowed = ['.csv', '.xlsx', '.pdf']
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowed.includes(ext)) {
      setUploadError(`Unsupported file type "${ext}". Upload a CSV, XLSX, or PDF trial balance.`)
      return
    }
    setUploadError(null)
    setPhase({ tag: 'classifying' })
    try {
      const result = await uploadDocument(entity.tin, file, entity)
      setClassifyResult(result)
      setLineItems(result.line_items)
      setPhase({ tag: 'classified' })
      notify({
        title: 'File Classified',
        body: `${file.name} classified into ${result.line_items.length} line items.`,
        kind: 'success'
      })
      // Create draft record (best-effort)
      const label = `${persona.label} · Form C ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}`
      try {
        const draft = await createDraftFiling({ tin: entity.tin, label, line_items: result.line_items })
        setDraftId(draft.id)
      } catch {
        // Silently ignore
      }
    } catch (e) {
      const msg = (e as Error).message
      setUploadError(`Upload failed: ${msg}. Paste the trial balance text below instead.`)
      setPhase({ tag: 'idle' })
    }
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleUpload(file)
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
          // No draft was created (e.g. BE was down during classify) — create the final record now
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

  function handleReset() {
    setPhase({ tag: 'idle' })
    setClassifyResult(null)
    setLineItems([])
    setLatestResult(null)
    setDraftId(null)
  }

  return (
    <>
      <div className="page-head">
        <h1>New Filing</h1>
        <p className="page-kicker">
          Classify your trial balance, then compute a cited Form C with the deterministic core. Form C · YA2026 ·{' '}
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

      {/* Stage 1: Trial Balance Input */}
      {!entityLoading && entity && (phase.tag === 'idle' || phase.tag === 'error') && (
        <div className="window" style={{ marginTop: 16 }}>
          <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="titlebar-title">Stage 01 - Trial Balance</span>
            <InfoTip content="Provide your trial balance -- a list of account names and their balances for the assessment year. The AI will classify each line; the tax computation is then done by the deterministic rule-based core." />
            <span className="titlebar-meta">paste or upload</span>
          </div>
          <div style={{ padding: '16px 18px', display: 'grid', gap: 14 }}>
            {/* Primary: guided textarea */}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ink)',
                  marginBottom: 6,
                  fontWeight: 600
                }}
              >
                Provide your trial balance -- one account per line
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  marginBottom: 8,
                  padding: '6px 10px',
                  background: 'var(--screen)',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)'
                }}
              >
                Format: AccountName &nbsp; Amount (e.g. "Revenue &nbsp; 5000000")
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                style={{
                  width: '100%',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  background: 'var(--screen)',
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px',
                  color: 'var(--ink)',
                  resize: 'vertical'
                }}
                placeholder="Revenue  5000000
Salaries and wages  2000000
Repairs and maintenance  4800
Depreciation  120000"
              />
              <button
                type="button"
                onClick={() => void handleClassify()}
                disabled={!rawText.trim()}
                style={{
                  marginTop: 10,
                  padding: '8px 20px',
                  border: 'var(--border)',
                  background: 'var(--denim)',
                  color: 'var(--paper)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: rawText.trim() ? 'pointer' : 'not-allowed',
                  borderRadius: 'var(--radius)',
                  opacity: rawText.trim() ? 1 : 0.5
                }}
              >
                Classify
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--grid)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                or upload a file (secondary)
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--grid)' }} />
            </div>

            {/* Secondary: file drop */}
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
                padding: '16px',
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
                Drop a CSV, XLSX, or PDF trial balance here
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>
                or click to browse
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleUpload(file)
                  e.target.value = ''
                }}
              />
            </button>

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
      )}

      {/* Pipeline stepper + detail panels */}
      {phase.tag !== 'idle' && !entityLoading && (
        <>
          {/* Pipeline card — shown while in progress; hidden in done (it moves under Computed) */}
          {phase.tag !== 'done' && (
            <div className="window" style={{ marginTop: 16 }}>
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Filing Pipeline</span>
                <InfoTip content="The AI classifies your line items (Step 1). Steps 2-4 are performed entirely by the deterministic rule-based core -- no AI is involved in computing the tax figure." />
                {isLoading && <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />}
              </div>
              <div className="row-div-list">
                {stages.map((stage) => (
                  <StageRow key={stage.id} stage={stage} isActive={activeStageId === stage.id} />
                ))}
              </div>
            </div>
          )}

          {/* Stage 1 detail: classified line items */}
          {classifyResult && phase.tag !== 'classifying' && (
            <>
              <Stage1Detail classifyResult={classifyResult} lineItems={lineItems} />

              {/* Compute button -- shown once classify completes, before computing */}
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
                    onClick={handleReset}
                    style={{
                      padding: '8px 16px',
                      border: 'var(--border)',
                      background: 'transparent',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    Edit Trial Balance
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
                headingTip="The tax figure was computed by the deterministic, rule-based core -- not the AI. The AI only classified your trial-balance line items in Step 1. Every figure traces to a specific rule ID and config version. Expand technical details below to see the full per-figure trace."
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
                  <InfoTip content="The AI classifies your line items (Step 1). Steps 2-4 are performed entirely by the deterministic rule-based core -- no AI is involved in computing the tax figure." />
                </div>
                <div className="row-div-list">
                  {stages.map((stage) => (
                    <StageRow key={stage.id} stage={stage} isActive={activeStageId === stage.id} />
                  ))}
                </div>
                {/* Technical details disclosure */}
                <TechnicalDetailsDisclosure computation={latestResult.computation} classifyRouteInfo={classifyResult} />
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
