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
  deleteFilings,
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
function CitationChip({ citation, showRejectedStamp = false }: { citation: Citation; showRejectedStamp?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = citation.section ?? citation.page_ref ?? citation.url ?? citation.passage
  const showVerification = citation.verified || showRejectedStamp
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 4,
        padding: '4px 10px',
        border: citation.verified
          ? '1px solid var(--denim)'
          : showRejectedStamp
            ? '1px solid var(--rust)'
            : 'var(--border)',
        borderRadius: 'var(--radius)',
        background: citation.verified
          ? 'rgba(65,82,110,0.05)'
          : showRejectedStamp
            ? 'rgba(181,80,60,0.05)'
            : 'var(--window)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        maxWidth: '100%'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
        {showVerification ? (
          <VerifiedBadge verified={citation.verified} />
        ) : (
          <span style={{ color: 'var(--ink-soft)', fontSize: 10, textTransform: 'uppercase' }}>Source</span>
        )}
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
  // Ordinary answers should still show unverified citations as small source chips. The rejected
  // stamp remains exclusive to the Trust Demo path, where rejection is the point.
  const citationChips = data.citations
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

        {/* Inline citation chips. Ordinary unverified citations render neutrally; the red
            REJECTED stamp is only used by the Trust Demo dedicated rejection path. */}
        {citationChips.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {citationChips.map((c) => (
              <CitationChip
                key={`${c.claim}-${c.clause_ids.join(',')}`}
                citation={c}
                showRejectedStamp={msg.isFabrication}
              />
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

type SortKey = 'newest' | 'oldest' | 'tax-payable'

function filingTaxPayable(rec: FilingRecord): number | null {
  return rec.computation?.fields?.tax_payable?.value ?? null
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

  // Frontpage dashboard state (multi-select + delete + sort), mirroring the Filing Records page
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [pageError, setPageError] = useState<string | null>(null)
  // Filing-picker modal (opened by "+ Select Filing" on the dashboard and "Switch Filing" in the chat)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Chat state
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [convLoading, setConvLoading] = useState(false)
  // Suggested/follow-up chips are collapsed by default to save vertical space
  const [chipsExpanded, setChipsExpanded] = useState(false)
  // Scroll the thread container itself (not scrollIntoView, which would scroll the whole page)
  const threadScrollRef = useRef<HTMLDivElement>(null)

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

  // Auto-scroll the thread container to the bottom on new messages (scrolls only the contained
  // thread, never the page — the chat lives in a fixed modal).
  useEffect(() => {
    const el = threadScrollRef.current
    if (el && thread.length > 0) {
      el.scrollTop = el.scrollHeight
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
    setChipsExpanded(false)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Sorted view of the defensible filings
  const sortedFilings = [...filings]
  if (sortKey === 'oldest') {
    sortedFilings.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  } else if (sortKey === 'tax-payable') {
    sortedFilings.sort((a, b) => (filingTaxPayable(b) ?? -1) - (filingTaxPayable(a) ?? -1))
  }
  const allSelected = sortedFilings.length > 0 && sortedFilings.every((r) => selected.has(r.id))

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(sortedFilings.map((r) => r.id)))
  }

  async function handleDeleteFilings() {
    if (selected.size === 0) return
    setDeleting(true)
    setPageError(null)
    try {
      await deleteFilings(Array.from(selected))
      setFilings((prev) => prev.filter((r) => !selected.has(r.id)))
      setSelected(new Set())
    } catch (e) {
      setPageError(`Could not delete the selected filing(s): ${(e as Error).message}`)
    } finally {
      setDeleting(false)
    }
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
    setChipsExpanded(false)
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
  // Collapsible chip section: follow-ups after a reply, else the seed suggestions
  const activeChips = followupChips.length > 0 ? followupChips : suggestedQuestions
  const chipSectionLabel = followupChips.length > 0 ? 'Follow-up questions' : 'Suggested questions'
  const chipVariant: 'default' | 'followup' = followupChips.length > 0 ? 'followup' : 'default'

  return (
    <>
      <div className="page-head">
        <h1>Audit Assistant</h1>
        <p className="page-kicker">
          When LHDN questions a figure on your filing, get a citation-grounded justification. Select a saved filing to
          defend; every citation is verified and fabricated clause IDs are rejected.
        </p>
      </div>

      {/* Dashboard (base layer; the chat + picker modals float above it) */}
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

        {pageError && (
          <div className="window error-window" style={{ marginBottom: 12 }}>
            <div className="titlebar">
              <span className="titlebar-title">Error</span>
            </div>
            <div className="error-body">{pageError}</div>
          </div>
        )}

        {!filingsLoading && filings.length > 0 && (
          <>
            {/* Sort control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort by"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  border: 'var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--screen)',
                  color: 'var(--ink)',
                  padding: '4px 8px',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="tax-payable">Tax payable (high to low)</option>
              </select>
            </div>

            {/* Toolbar: select-all + delete-selected (left), New Filing CTA (right) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 8,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="audit-select-all"
                  checked={allSelected}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                  aria-label="Select all filings"
                />
                <label
                  htmlFor="audit-select-all"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-soft)',
                    cursor: 'pointer'
                  }}
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </label>
                {selected.size > 0 && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void handleDeleteFilings()}
                    style={{
                      padding: '5px 14px',
                      border: '1px solid var(--rust)',
                      background: 'var(--window)',
                      color: deleting ? 'var(--ink-soft)' : 'var(--rust)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      cursor: deleting ? 'not-allowed' : 'pointer',
                      borderRadius: 'var(--radius)'
                    }}
                  >
                    {deleting ? 'Deleting...' : `Delete Selected (${selected.size})`}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                style={{
                  display: 'inline-block',
                  padding: '8px 18px',
                  border: 'none',
                  background: 'var(--denim)',
                  color: 'var(--paper)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer'
                }}
              >
                + Select Filing
              </button>
            </div>

            <div className="window">
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">
                  {filings.length} Filing{filings.length !== 1 ? 's' : ''} to Defend
                </span>
                <InfoTip content="Click a row to open the chat and defend that filing's figures. Use the checkboxes to select filings for deletion." />
              </div>
              <div className="row-div-list">
                {sortedFilings.map((rec) => {
                  const tp = rec.computation?.fields?.tax_payable?.value
                  const showTp = tp != null && isPlausibleFigure(tp)
                  const isSelected = selected.has(rec.id)
                  return (
                    <div
                      key={rec.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '32px minmax(0, 1fr)',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 18px',
                        background: isSelected ? 'var(--screen)' : 'transparent',
                        transition: 'background 150ms'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(rec.id)}
                          style={{ cursor: 'pointer' }}
                          aria-label={`Select ${rec.label}`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void selectFiling(rec)}
                        style={{
                          display: 'block',
                          width: '100%',
                          minWidth: 0,
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer'
                        }}
                      >
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
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </>

      {/* Chat workbench — floats over the dashboard in a blurred modal so the page never scrolls */}
      {selectedFiling && (
        <div className="audit-modal-backdrop">
          <button type="button" className="audit-modal-scrim" aria-label="Close chat" onClick={clearFiling} />
          <dialog open className="window audit-modal-panel" aria-label={`Audit chat for ${selectedFiling.label}`}>
            {/* Modal header: defending-filing info + Switch Filing + Close */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                justifyContent: 'space-between'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--ink-soft)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  Defending Filing
                </span>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {selectedFiling.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                  {selectedFiling.tin} · {formatDate(selectedFiling.created_at)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => {
                    clearFiling()
                    setPickerOpen(true)
                  }}
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
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={clearFiling}
                  style={{
                    width: 30,
                    height: 30,
                    border: 'var(--border)',
                    background: 'transparent',
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Two-pane layout fills the modal; stacks on narrow viewports via CSS */}
            <div className="audit-workbench">
              {/* LEFT PANE: figure rows */}
              <div className="window audit-pane">
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
                  <div className="row-div-list audit-pane-scroll">
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
              <div className="window audit-conversation">
                <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="titlebar-title">Conversation</span>
                  <InfoTip content="Each answer is grounded in Malaysian tax law. Citations show the exact clause IDs and source passages. Fabricated clause IDs are rejected by the deterministic gate." />
                </div>

                {/* (a) Message thread (scrolls; composer + chips stay pinned below) */}
                <div
                  ref={threadScrollRef}
                  className="audit-pane-scroll"
                  style={{ padding: '16px 18px', display: 'grid', gap: 16, alignContent: 'start' }}
                >
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
                </div>

                {/* (b) Chips: collapsible suggested/follow-up questions (collapsed by default);
                  the Trust Demo action stays visible. */}
                <div style={{ borderTop: 'var(--border)' }}>
                  <div
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                  >
                    {activeChips.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setChipsExpanded((v) => !v)}
                        aria-expanded={chipsExpanded}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'transparent',
                          border: 'var(--border)',
                          borderRadius: 'var(--radius)',
                          padding: '5px 10px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--ink-soft)'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            transform: chipsExpanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 150ms'
                          }}
                        >
                          ▸
                        </span>
                        {chipSectionLabel} ({activeChips.length})
                      </button>
                    )}
                    {/* Trust Demo chip: always visible */}
                    <Chip
                      label="Trust Demo: inject fabricated clause"
                      onClick={handleTrustDemo}
                      disabled={chatLoading}
                      variant="trust-demo"
                    />
                  </div>
                  {chipsExpanded && activeChips.length > 0 && (
                    <div style={{ padding: '0 16px 10px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {activeChips.map((q) => (
                        <Chip
                          key={q}
                          label={q}
                          onClick={() => handleChip(q)}
                          disabled={chatLoading}
                          variant={chipVariant}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* (c) Ask composer — Send sits inside the fixed (unresizable) input field */}
                <div style={{ padding: '12px 16px', borderTop: 'var(--border)' }}>
                  <div style={{ position: 'relative' }}>
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
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        background: 'var(--screen)',
                        border: 'var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '10px 12px 42px',
                        color: 'var(--ink)',
                        resize: 'none',
                        opacity: chatLoading ? 0.6 : 1
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!inputText.trim() || chatLoading}
                      style={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        padding: '6px 16px',
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
          </dialog>
        </div>
      )}

      {/* Filing-picker modal — pick a completed filing to defend, or create a new one */}
      {pickerOpen && (
        <div className="audit-modal-backdrop">
          <button type="button" className="audit-modal-scrim" aria-label="Close" onClick={() => setPickerOpen(false)} />
          <dialog open className="window audit-picker-panel" aria-label="Select a filing to defend">
            <div
              className="titlebar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span className="titlebar-title">Select a Filing to Defend</span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerOpen(false)}
                style={{
                  width: 26,
                  height: 26,
                  border: 'var(--border)',
                  background: 'transparent',
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {filings.length === 0 ? (
              <div
                style={{
                  padding: '24px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.6
                }}
              >
                No completed filings yet. Create one first, then come back to defend its figures.
              </div>
            ) : (
              <div className="row-div-list audit-pane-scroll">
                {sortedFilings.map((rec) => {
                  const tp = rec.computation?.fields?.tax_payable?.value
                  const showTp = tp != null && isPlausibleFigure(tp)
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setPickerOpen(false)
                        void selectFiling(rec)
                      }}
                      style={{
                        width: '100%',
                        display: 'block',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        padding: '12px 18px',
                        cursor: 'pointer'
                      }}
                    >
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
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ padding: '12px 18px', borderTop: 'var(--border)' }}>
              <Link
                to="/filing/new"
                style={{
                  display: 'inline-block',
                  padding: '8px 18px',
                  background: 'var(--denim)',
                  color: 'var(--paper)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  borderRadius: 'var(--radius)'
                }}
              >
                + Create a Filing
              </Link>
            </div>
          </dialog>
        </div>
      )}
    </>
  )
}
