// PR-B FE-2.6 + PR-C FE -- Audit Assistant (renamed from AuditDefense).
// (6a) Route: /audit-assistant (redirect from /audit-defense handled in App.tsx).
// (6b) Two-pane figure workbench: LEFT = filing figures; RIGHT = Q&A thread.
// (6c) Figure guard: non-finite / out-of-range / placeholder TIN values are excluded.
// PR-C: Pandai persona avatar + name on each answer bubble; conversational answer replaces
//       structured panel; inline citation chips (verified/rejected); per-filing conversation
//       memory via GET /me/filings/{id}/conversation; follow-up chips after each answer.

import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  type AuditDefenseResponse,
  type Citation,
  type ConversationTurn,
  type FilingRecord,
  type LineItem,
  getAuditDefense,
  getFilingConversation,
  listFilings
} from '../api/client'
import { SovereignBadge, VerifiedBadge } from '../components/CitationPanel'
import { Skeleton } from '../components/Skeleton'
import { InfoTip } from '../components/Tooltip'
import { useEntity } from '../hooks/useEntity'
import { useNotifications } from '../notifications'

// --- Constants ---

// Max plausible RM value: RM 100 billion (generous upper bound for even large Malaysian corps)
const MAX_PLAUSIBLE_RM = 100_000_000_000

// Placeholder TINs to treat as unavailable
const PLACEHOLDER_TINS = new Set(['Z0000000001', 'Z0000000000'])

const TRUST_DEMO_QUERY = 'Claim deduction under ITA-1967-s999-FAKE (fictitious relief clause)'
const TRUST_DEMO_EVIDENCE: [string, string][] = [['claim', 'Fabricated clause ITA-1967-s999-FAKE RM50,000 deduction']]

// --- Types ---

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  data?: AuditDefenseResponse
  error?: string
  isFabrication?: boolean
  followups?: string[]
}

// --- Helpers ---

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatRM(value: number): string {
  return `RM ${value.toLocaleString('en-MY')}`
}

/** Return true if a numeric figure is genuine (finite + within plausible range). */
function isPlausibleFigure(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_PLAUSIBLE_RM
}

/** Return true if a TIN is a known placeholder. */
function isPlaceholderTin(tin: string): boolean {
  return PLACEHOLDER_TINS.has(tin)
}

/** Field-key -> readable label. */
const FIELD_LABELS: Record<string, string> = {
  gross_income: 'Gross Income',
  adjusted_income: 'Adjusted Income',
  chargeable_income: 'Chargeable Income',
  tax_payable: 'Tax Payable',
  capital_allowances: 'Capital Allowances'
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Derive evidence pairs from a filing's computation fields (for the audit-defense call). */
function filingEvidence(rec: FilingRecord): [string, string][] {
  const fields = rec.computation?.fields ?? {}
  return Object.entries(fields)
    .filter(([, trace]) => isPlausibleFigure(trace.value))
    .map(([key, trace]) => [key, formatRM(trace.value)])
}

interface FigureRow {
  key: string
  label: string
  amount: string
  question: string
}

/** Derive clickable figure rows from a filing's computation fields + line items.
 *  Guards corrupt/overflowing values; excludes placeholder TINs. */
function deriveFigureRows(rec: FilingRecord): FigureRow[] {
  const rows: FigureRow[] = []

  if (isPlaceholderTin(rec.tin)) return rows

  const fields = rec.computation?.fields ?? {}
  for (const [key, trace] of Object.entries(fields)) {
    if (!isPlausibleFigure(trace.value)) continue
    const label = fieldLabel(key)
    const amount = formatRM(trace.value)
    let question: string
    if (key === 'tax_payable') {
      question = `Why is the tax payable ${amount}?`
    } else if (key === 'chargeable_income') {
      question = `How is the chargeable income of ${amount} derived?`
    } else if (key === 'capital_allowances') {
      question = `Is the ${amount} capital allowances deductible?`
    } else if (key === 'adjusted_income') {
      question = `How is the adjusted income of ${amount} calculated?`
    } else if (key === 'gross_income') {
      question = `Is the ${amount} gross income figure correct for YA2026?`
    } else {
      question = `Justify the ${label} figure of ${amount}`
    }
    rows.push({ key, label, amount, question })
  }

  // Add classified line items (up to 5)
  const lineItems: LineItem[] = rec.line_items ?? []
  let liCount = 0
  for (const li of lineItems) {
    if (liCount >= 5) break
    if (!isPlausibleFigure(li.amount)) continue
    const liKey = `li_${li.code}`
    if (rows.some((r) => r.key === liKey)) continue
    rows.push({
      key: liKey,
      label: li.description,
      amount: formatRM(li.amount),
      question: `Justify the ${li.description} of ${formatRM(li.amount)}`
    })
    liCount++
  }

  return rows
}

/** Starting suggested questions when thread is empty. */
function seedQuestions(rec: FilingRecord): string[] {
  return deriveFigureRows(rec)
    .slice(0, 5)
    .map((r) => r.question)
}

/** Convert persisted ConversationTurn[] to ChatMessage[] for display. */
function turnsToMessages(turns: ConversationTurn[]): ChatMessage[] {
  return turns.map((t) => ({
    role: t.role as 'user' | 'assistant',
    text: t.content,
    data:
      t.role === 'assistant'
        ? {
            query: '',
            items: [],
            citations: t.citations ?? [],
            exposure_note: t.content,
            answer: t.content,
            sovereign: true,
            active_model: 'nemo-super'
          }
        : undefined
  }))
}

// --- Sub-components ---

/** Chip button styled consistently (suggested questions + follow-ups). */
function Chip({
  label,
  onClick,
  disabled,
  variant = 'default'
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'followup' | 'trust-demo'
}) {
  const isTrust = variant === 'trust-demo'
  const isFollowup = variant === 'followup'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px',
        border: isTrust ? '1px solid var(--rust)' : isFollowup ? '1px solid var(--mustard)' : 'var(--border)',
        borderRadius: 'var(--radius)',
        background: isTrust ? 'rgba(181,80,60,0.06)' : isFollowup ? 'rgba(224,169,59,0.12)' : 'var(--screen)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: isTrust ? 'var(--rust)' : isFollowup ? 'var(--ink)' : 'var(--ink)',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.6 : 1
      }}
    >
      {label}
    </button>
  )
}

/** Inline citation chip shown under each Pandai answer. */
function CitationChip({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = citation.section ?? citation.page_ref ?? citation.url ?? citation.passage
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 4,
        padding: '4px 10px',
        border: citation.verified ? '1px solid var(--denim)' : '1px solid var(--rust)',
        borderRadius: 'var(--radius)',
        background: citation.verified ? 'rgba(65,82,110,0.05)' : 'rgba(181,80,60,0.05)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        maxWidth: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
        <VerifiedBadge verified={citation.verified} />
        <span style={{ color: 'var(--ink)', lineHeight: 1.4, minWidth: 0, overflowWrap: 'anywhere' }}>
          {citation.claim}
        </span>
      </div>
      {citation.clause_ids.length > 0 && (
        <div style={{ color: 'var(--ink-soft)', paddingLeft: 2, overflowWrap: 'anywhere' }}>
          {citation.clause_ids.join(', ')}
        </div>
      )}
      {hasDetail && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--denim)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            textAlign: 'left'
          }}
        >
          {expanded ? 'Hide source' : 'Source detail'}
        </button>
      )}
      {expanded && (
        <div className="trace-detail" style={{ paddingLeft: 4, display: 'grid', gap: 3, color: 'var(--ink-soft)' }}>
          {citation.section && (
            <div>
              <strong style={{ color: 'var(--ink)' }}>Section:</strong> {citation.section}
            </div>
          )}
          {citation.page_ref && (
            <div>
              <strong style={{ color: 'var(--ink)' }}>Page ref:</strong> {citation.page_ref}
            </div>
          )}
          {citation.url && (
            <div>
              <strong style={{ color: 'var(--ink)' }}>URL:</strong>{' '}
              <a href={citation.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--denim)' }}>
                {citation.url}
              </a>
            </div>
          )}
          {citation.passage && (
            <div
              style={{
                borderLeft: '2px solid var(--grid)',
                paddingLeft: 6,
                fontStyle: 'italic',
                color: 'var(--ink)'
              }}
            >
              {citation.passage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Pandai avatar + name header for assistant turns. */
function PandaiHeader({ sovereign, model }: { sovereign: boolean; model: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <img
        src="/logo.png"
        alt="Pandai"
        style={{ width: 28, height: 28, borderRadius: '50%', border: 'var(--border)', flexShrink: 0 }}
      />
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        Pandai
      </span>
      <SovereignBadge sovereign={sovereign} model={model} />
    </div>
  )
}

/** Single assistant turn: Pandai avatar + conversational answer + inline citation chips. */
function AssistantTurn({ msg }: { msg: ChatMessage }) {
  const data = msg.data

  if (!data) {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        <img
          src="/logo.png"
          alt="Pandai"
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'var(--border)', flexShrink: 0, marginTop: 2 }}
        />
        <div
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'var(--screen)',
            borderRadius: 'var(--radius)',
            borderLeft: '3px solid var(--rust)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--rust)'
          }}
        >
          {msg.error ?? 'An error occurred. Please try again.'}
        </div>
      </div>
    )
  }

  const verifiedCitations = data.citations.filter((c) => c.verified)
  const rejectedCitations = data.citations.filter((c) => !c.verified)
  const answerText = data.answer ?? data.exposure_note

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Fabrication money-shot: shown when Trust Demo ran and a fabricated clause was rejected */}
      {msg.isFabrication && rejectedCitations.length > 0 && (
        <div className="window" style={{ borderColor: 'var(--rust)', background: 'rgba(181,80,60,0.04)' }}>
          <div className="titlebar" style={{ borderBottomColor: 'var(--rust)' }}>
            <span className="titlebar-title" style={{ color: 'var(--rust)' }}>
              Trust Payoff: Fabricated Clause Blocked
            </span>
            <span className="unverified-stamp verified-stamp" style={{ transform: 'rotate(3deg)' }}>
              BLOCKED
            </span>
          </div>
          <div
            style={{
              padding: '12px 18px',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--ink)',
              lineHeight: 1.6
            }}
          >
            The clause ID{' '}
            <strong style={{ color: 'var(--rust)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {rejectedCitations.flatMap((c) => c.clause_ids).join(', ')}
            </strong>{' '}
            is not present in the law corpus. The deterministic <code>ground_citation</code> gate set{' '}
            <code>verified=false</code>: fabricated clause IDs cannot pass.
            {verifiedCitations.length > 0 && (
              <span>
                {' '}
                The genuine citation passes:{' '}
                <strong style={{ color: 'var(--denim)' }}>{verifiedCitations[0].clause_ids.join(', ')}</strong>{' '}
                <VerifiedBadge verified={true} />
              </span>
            )}
          </div>
        </div>
      )}

      {/* Pandai conversational answer bubble */}
      <div>
        <PandaiHeader sovereign={data.sovereign} model={data.active_model} />
        <div
          style={{
            background: 'var(--screen)',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--ink)'
          }}
        >
          {answerText}
        </div>

        {/* Inline citation chips */}
        {data.citations.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.citations.map((c) => (
              <CitationChip key={`${c.claim}-${c.clause_ids.join(',')}`} citation={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Single user message bubble. */
function UserBubble({ text, isFabrication }: { text: string; isFabrication?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        style={{
          maxWidth: '80%',
          padding: '9px 14px',
          background: isFabrication ? 'rgba(181,80,60,0.08)' : 'var(--screen)',
          border: isFabrication ? '1px solid var(--rust)' : 'var(--border)',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: isFabrication ? 'var(--rust)' : 'var(--ink)',
          lineHeight: 1.5
        }}
      >
        {isFabrication && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--rust)', marginRight: 6 }}>
            [TRUST DEMO]
          </span>
        )}
        {text}
      </div>
    </div>
  )
}

// --- Main component ---

export default function AuditAssistant() {
  const { error: entityError } = useEntity()
  const { notify } = useNotifications()
  const [searchParams] = useSearchParams()
  const deepLinkFilingId = searchParams.get('filing')

  // Filing picker state
  const [filings, setFilings] = useState<FilingRecord[]>([])
  const [filingsLoading, setFilingsLoading] = useState(true)
  const [selectedFiling, setSelectedFiling] = useState<FilingRecord | null>(null)
  // Track whether the deep-link preselect has been attempted (once per mount)
  const deepLinkApplied = useRef(false)

  // Chat state
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [convLoading, setConvLoading] = useState(false)
  const threadEndRef = useRef<HTMLDivElement>(null)

  // Load filing records on mount
  useEffect(() => {
    setFilingsLoading(true)
    listFilings()
      .then((recs) => {
        setFilings(recs.filter((r) => r.status === 'final' && r.computation != null))
        setFilingsLoading(false)
      })
      .catch(() => setFilingsLoading(false))
  }, [])

  // Deep-link preselect: once filings have loaded and ?filing=<id> is in the URL,
  // auto-select that filing (skip the picker and go straight to the workbench).
  // Falls back to normal picker if the id is not found or filings are still loading.
  useEffect(() => {
    if (!deepLinkFilingId || filingsLoading || deepLinkApplied.current || selectedFiling) return
    const match = filings.find((r) => r.id === deepLinkFilingId)
    if (!match) return
    deepLinkApplied.current = true
    void selectFiling(match)
  }, [filings, filingsLoading, deepLinkFilingId, selectedFiling])

  // Reset when persona switches (entity error guard)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when entity changes
  useEffect(() => {
    setThread([])
    setInputText('')
    setSelectedFiling(null)
    deepLinkApplied.current = false
    setFilingsLoading(true)
    listFilings()
      .then((recs) => {
        setFilings(recs.filter((r) => r.status === 'final' && r.computation != null))
        setFilingsLoading(false)
      })
      .catch(() => setFilingsLoading(false))
  }, [entityError])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (thread.length > 0) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread.length])

  async function selectFiling(rec: FilingRecord) {
    setSelectedFiling(rec)
    setThread([])
    setInputText('')
    // Load persisted conversation for this filing (getFilingConversation calls ensureSession internally)
    setConvLoading(true)
    try {
      const turns = await getFilingConversation(rec.id)
      if (turns.length > 0) {
        setThread(turnsToMessages(turns))
      }
    } catch {
      // Non-fatal: start with an empty thread
    } finally {
      setConvLoading(false)
    }
  }

  function clearFiling() {
    setSelectedFiling(null)
    setThread([])
    setInputText('')
  }

  async function sendMessage(query: string, evidence: [string, string][], isFabrication: boolean) {
    if (!selectedFiling || !query.trim() || chatLoading) return

    const userMsg: ChatMessage = { role: 'user', text: query, isFabrication }
    setThread((prev) => [...prev, userMsg])
    setInputText('')
    setChatLoading(true)

    try {
      const res = await getAuditDefense(selectedFiling.tin, query.trim(), evidence, isFabrication, selectedFiling.id)
      const followups = (res.followups ?? []).filter((f) => f.trim().length > 0)
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: res.answer ?? res.exposure_note,
        data: res,
        isFabrication,
        followups
      }
      setThread((prev) => [...prev, assistantMsg])
      if (isFabrication) {
        const rejected = res.citations.filter((c) => !c.verified)
        if (rejected.length > 0) {
          notify({
            title: 'Fabricated Citation Rejected',
            body: `Deterministic gate blocked ${rejected.length} fabricated clause${rejected.length !== 1 ? 's' : ''}.`,
            kind: 'error'
          })
        }
      }
    } catch (e) {
      const errMsg = (e as Error).message ?? 'Request failed'
      setThread((prev) => [...prev, { role: 'assistant', text: '', error: errMsg }])
    } finally {
      setChatLoading(false)
    }
  }

  function handleSend() {
    if (!selectedFiling || !inputText.trim() || chatLoading) return
    const evidence = filingEvidence(selectedFiling)
    void sendMessage(inputText, evidence, false)
  }

  function handleChip(question: string) {
    if (!selectedFiling || chatLoading) return
    const evidence = filingEvidence(selectedFiling)
    void sendMessage(question, evidence, false)
  }

  function handleTrustDemo() {
    if (!selectedFiling || chatLoading) return
    void sendMessage(TRUST_DEMO_QUERY, TRUST_DEMO_EVIDENCE, true)
  }

  const figureRows = selectedFiling ? deriveFigureRows(selectedFiling) : []
  const suggestedQuestions = selectedFiling ? seedQuestions(selectedFiling) : []
  // Last assistant message's follow-up chips (shown after a reply)
  const lastAssistantMsg = [...thread].reverse().find((m) => m.role === 'assistant' && (m.followups?.length ?? 0) > 0)
  const followupChips: string[] = lastAssistantMsg?.followups ?? []

  return (
    <>
      <div className="page-head">
        <h1>Audit Assistant</h1>
        <p className="page-kicker">
          When LHDN questions a figure on your filing, get a citation-grounded justification. Select a saved filing to
          defend; every citation is verified and fabricated clause IDs are rejected.
        </p>
      </div>

      {/* Filing picker (shown when no filing is selected) */}
      {!selectedFiling && (
        <>
          {filingsLoading && (
            <div className="window" aria-label="Loading filed returns">
              <div className="titlebar">
                <span className="titlebar-title">Your Filed Returns</span>
              </div>
              <div className="row-div-list">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto',
                      gap: 14,
                      alignItems: 'center',
                      padding: '14px 18px'
                    }}
                  >
                    <div style={{ display: 'grid', gap: 5 }}>
                      <Skeleton height={13} width="50%" />
                      <Skeleton height={11} width="30%" />
                    </div>
                    <Skeleton height={18} width={80} />
                    <Skeleton height={22} width={60} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!filingsLoading && filings.length === 0 && (
            <div className="window" style={{ padding: '48px 24px', textAlign: 'center', display: 'grid', gap: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                No saved filings found. Complete a Form C filing first, then return here to defend any figure with a
                citation-grounded justification.
              </div>
              <div>
                <Link
                  to="/filing/new"
                  style={{
                    display: 'inline-block',
                    padding: '9px 22px',
                    background: 'var(--denim)',
                    color: 'var(--paper)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    borderRadius: 'var(--radius)'
                  }}
                >
                  Create a Filing
                </Link>
              </div>
            </div>
          )}

          {!filingsLoading && filings.length > 0 && (
            <div className="window">
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Your Filed Returns</span>
                <InfoTip content="Select a filing to defend its figures. Pandai will use that filing's actual computed figures as evidence when building justifications." />
              </div>
              <div className="row-div-list">
                {filings.map((rec) => {
                  const tp = rec.computation?.fields?.tax_payable?.value
                  const showTp = tp != null && isPlausibleFigure(tp)
                  return (
                    <div
                      key={rec.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 18px'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--ink)',
                            marginBottom: 4
                          }}
                        >
                          {rec.label}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--ink-soft)',
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap'
                          }}
                        >
                          <span>{rec.tin}</span>
                          <span>{formatDate(rec.created_at)}</span>
                          {showTp && <span>Tax payable: {formatRM(tp)}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          void selectFiling(rec)
                        }}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          background: 'var(--denim)',
                          color: 'var(--paper)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 'var(--radius)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Defend This Filing
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Two-pane workbench (shown once a filing is selected) */}
      {selectedFiling && (
        <>
          {/* Breadcrumb back-link */}
          <div style={{ marginBottom: 10 }}>
            <button
              type="button"
              onClick={clearFiling}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--ink-soft)',
                textDecoration: 'none'
              }}
            >
              ← Back to Chat Records
            </button>
          </div>

          {/* Selected filing header */}
          <div
            className="window"
            style={{
              marginBottom: 16,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 12,
              padding: '14px 18px'
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4
                }}
              >
                Defending Filing
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                {selectedFiling.label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                {selectedFiling.tin} · {formatDate(selectedFiling.created_at)}
              </div>
            </div>
            <button
              type="button"
              onClick={clearFiling}
              style={{
                padding: '6px 14px',
                border: 'var(--border)',
                background: 'transparent',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Switch Filing
            </button>
          </div>

          {/* Two-pane layout: responsive grid (stacks on narrow viewports via CSS) */}
          <div className="audit-workbench">
            {/* LEFT PANE: figure rows */}
            <div className="window">
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Filing Figures</span>
                <InfoTip content="Click any figure to ask Pandai about it. Each figure is derived from the selected filing's deterministic computation." />
              </div>
              {figureRows.length === 0 ? (
                <div
                  style={{
                    padding: '16px 18px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--ink-soft)'
                  }}
                >
                  No figures available for this filing.
                </div>
              ) : (
                <div className="row-div-list">
                  {figureRows.map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => handleChip(row.question)}
                      disabled={chatLoading}
                      style={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 18px',
                        background: 'transparent',
                        border: 'none',
                        cursor: chatLoading ? 'default' : 'pointer',
                        textAlign: 'left',
                        opacity: chatLoading ? 0.6 : 1
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: 13,
                            color: 'var(--ink)',
                            marginBottom: 2
                          }}
                        >
                          {row.label}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--ink-soft)',
                            overflowWrap: 'anywhere'
                          }}
                        >
                          {row.amount}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--denim)',
                          flexShrink: 0
                        }}
                      >
                        Ask
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT PANE: single "Conversation" card with thread + chips + composer */}
            <div className="window" style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto auto', minHeight: 0 }}>
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Conversation</span>
                <InfoTip content="Each answer is grounded in Malaysian tax law. Citations show the exact clause IDs and source passages. Fabricated clause IDs are stamped REJECTED." />
              </div>

              {/* (a) Message thread */}
              <div style={{ padding: '16px 18px', display: 'grid', gap: 16, alignContent: 'start' }}>
                {convLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="barber" style={{ width: 60, height: 3, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                      Loading conversation...
                    </span>
                  </div>
                )}
                {thread.map((msg, idx) => (
                  <div key={`${msg.role}-${idx}`}>
                    {msg.role === 'user' ? (
                      <UserBubble text={msg.text} isFabrication={msg.isFabrication} />
                    ) : (
                      <AssistantTurn msg={msg} />
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="barber" style={{ width: 60, height: 3, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                      Pandai is thinking...
                    </span>
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>

              {/* (b) Chips: suggested questions (empty thread) OR follow-up chips (after reply) */}
              <div
                style={{
                  padding: '10px 16px',
                  borderTop: 'var(--border)',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap'
                }}
              >
                {(followupChips.length > 0 ? followupChips : suggestedQuestions).map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    onClick={() => handleChip(q)}
                    disabled={chatLoading}
                    variant={followupChips.length > 0 ? 'followup' : 'default'}
                  />
                ))}
                {/* Trust Demo chip: always visible */}
                <Chip
                  label="Trust Demo: inject fabricated clause"
                  onClick={handleTrustDemo}
                  disabled={chatLoading}
                  variant="trust-demo"
                />
              </div>

              {/* (c) Ask composer */}
              <div style={{ padding: '12px 16px', borderTop: 'var(--border)', display: 'grid', gap: 10 }}>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  rows={3}
                  placeholder="e.g. How do I justify the repairs deduction if LHDN questions it?"
                  disabled={chatLoading}
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    background: 'var(--screen)',
                    border: 'var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '10px 12px',
                    color: 'var(--ink)',
                    resize: 'vertical',
                    opacity: chatLoading ? 0.6 : 1
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputText.trim() || chatLoading}
                    style={{
                      padding: '8px 18px',
                      border: 'none',
                      borderRadius: 'var(--radius)',
                      background: !inputText.trim() || chatLoading ? 'var(--grid)' : 'var(--denim)',
                      color: 'var(--paper)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: !inputText.trim() || chatLoading ? 'default' : 'pointer'
                    }}
                  >
                    {chatLoading ? 'Working...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
