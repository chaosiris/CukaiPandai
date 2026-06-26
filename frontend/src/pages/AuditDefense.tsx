// AD-1 + AD-2 — Conversational Audit Assistant tied to a saved filing record.
// AD-1: filing-record picker ("Defend This Filing") + empty state linking to /filing/new.
// AD-2: multi-turn chat with suggested questions seeded from the selected filing's figures;
//        each message → one getAuditDefense() call (figures passed as evidence);
//        CitationPanel + VerifiedBadge + SovereignBadge per answer turn;
//        Trust Demo chip surfaces the deterministic fabrication-rejection money-shot;
//        switching the selected filing clears the chat thread.
// No backend change — /audit-defense already accepts free-text query + evidence.

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { type AuditDefenseResponse, type FilingRecord, getAuditDefense, listFilings } from '../api/client'
import { CitationPanel, SovereignBadge, VerifiedBadge } from '../components/CitationPanel'
import { InfoTip } from '../components/Tooltip'
import { useEntity } from '../hooks/useEntity'
import { useNotifications } from '../notifications'

// --- Types ---

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  data?: AuditDefenseResponse
  error?: string
  isFabrication?: boolean
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
  return `RM ${value.toLocaleString()}`
}

/** Derive evidence pairs from a filing's computation fields. */
function filingEvidence(rec: FilingRecord): [string, string][] {
  const fields = rec.computation?.fields ?? {}
  return Object.entries(fields).map(([key, trace]) => [key, formatRM(trace.value)])
}

/** Field-key → readable label for suggested question generation. */
const FIELD_LABELS: Record<string, string> = {
  gross_income: 'gross income',
  adjusted_income: 'adjusted income',
  chargeable_income: 'chargeable income',
  tax_payable: 'tax payable',
  capital_allowances: 'capital allowances'
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
}

/** Generate question chips from the filing's computation fields. */
function seedQuestions(rec: FilingRecord): string[] {
  const fields = rec.computation?.fields ?? {}
  const questions: string[] = []

  for (const [key, trace] of Object.entries(fields)) {
    const label = fieldLabel(key)
    const amount = formatRM(trace.value)

    if (key === 'tax_payable') {
      questions.push(`Why is the tax payable ${amount}?`)
    } else if (key === 'chargeable_income') {
      questions.push(`How is the chargeable income of ${amount} derived?`)
    } else if (key === 'capital_allowances') {
      questions.push(`Is the ${amount} capital allowances deductible?`)
    } else if (key === 'adjusted_income') {
      questions.push(`How is the adjusted income of ${amount} calculated?`)
    } else if (key === 'gross_income') {
      questions.push(`Is the ${amount} gross income figure correct for YA2026?`)
    } else {
      questions.push(`Justify the ${label} figure of ${amount}`)
    }
  }

  return questions.slice(0, 5) // at most 5 chips
}

const TRUST_DEMO_QUERY = 'Claim deduction under ITA-1967-s999-FAKE (fictitious relief clause)'
const TRUST_DEMO_EVIDENCE: [string, string][] = [['claim', 'Fabricated clause ITA-1967-s999-FAKE RM50,000 deduction']]

// --- Sub-components ---

/** Single assistant turn rendered in the chat thread. */
function AssistantTurn({ msg }: { msg: ChatMessage }) {
  const data = msg.data
  if (!data) {
    return (
      <div
        style={{
          padding: '12px 16px',
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
    )
  }

  const verifiedCitations = data.citations.filter((c) => c.verified)
  const rejectedCitations = data.citations.filter((c) => !c.verified)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Fabrication money-shot: elevated when Trust Demo ran */}
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

      {/* Defense Narrative */}
      <div className="window">
        <div className="titlebar">
          <span className="titlebar-title">Defense Narrative</span>
          <SovereignBadge sovereign={data.sovereign} model={data.active_model} />
        </div>
        <div style={{ padding: '14px 18px', fontSize: 14, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
          {data.exposure_note}
        </div>
      </div>

      {/* Citations */}
      <div className="window">
        <div className="titlebar">
          <span className="titlebar-title">Citations</span>
          <span className="titlebar-meta">
            {verifiedCitations.length} verified
            {rejectedCitations.length > 0 && <> · {rejectedCitations.length} rejected</>}
          </span>
        </div>
        <ul className="req-list">
          {data.citations.map((c) => (
            <CitationPanel key={c.claim} citation={c} />
          ))}
        </ul>
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

export default function AuditDefense() {
  const { error: entityError } = useEntity()
  const { notify } = useNotifications()

  // AD-1: filing records + selection state
  const [filings, setFilings] = useState<FilingRecord[]>([])
  const [filingsLoading, setFilingsLoading] = useState(true)
  const [selectedFiling, setSelectedFiling] = useState<FilingRecord | null>(null)

  // AD-2: chat state
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const threadEndRef = useRef<HTMLDivElement>(null)

  // Load filing records on mount
  useEffect(() => {
    setFilingsLoading(true)
    listFilings()
      .then((recs) => {
        setFilings(recs)
        setFilingsLoading(false)
      })
      .catch(() => {
        setFilingsLoading(false)
      })
  }, [])

  // Reset chat when persona switches (entity error guard)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset when persona/entity changes
  useEffect(() => {
    setThread([])
    setInputText('')
    setSelectedFiling(null)
    setFilings([])
    setFilingsLoading(true)
    listFilings()
      .then((recs) => {
        setFilings(recs)
        setFilingsLoading(false)
      })
      .catch(() => {
        setFilingsLoading(false)
      })
  }, [entityError])

  // Auto-scroll to bottom of chat thread on new messages
  useEffect(() => {
    if (thread.length > 0) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread.length])

  function selectFiling(rec: FilingRecord) {
    setSelectedFiling(rec)
    setThread([])
    setInputText('')
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
      const res = await getAuditDefense(selectedFiling.tin, query.trim(), evidence, isFabrication)
      const assistantMsg: ChatMessage = { role: 'assistant', text: res.exposure_note, data: res, isFabrication }
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

  const suggestedQuestions = selectedFiling ? seedQuestions(selectedFiling) : []

  return (
    <>
      <div className="page-head">
        <h1>Audit Assistant</h1>
        <p className="page-kicker">
          When LHDN questions a figure on your filing, get a citation-grounded justification. Select a saved filing to
          defend; every citation is verified and fabricated clause IDs are rejected.
        </p>
      </div>

      {/* AD-1: Filing picker (shown when no filing is selected) */}
      {!selectedFiling && (
        <>
          {filingsLoading && (
            <div className="window">
              <div className="titlebar">
                <span className="titlebar-title">Your Filed Returns</span>
                <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />
              </div>
              <div
                style={{ padding: '24px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}
              >
                Loading filings...
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
                <InfoTip content="Select a filing to defend its figures. The assistant will use that filing's actual computed figures as evidence when building justifications." />
              </div>
              {filings.map((rec) => {
                const tp = rec.computation?.fields?.tax_payable?.value
                return (
                  <div
                    key={rec.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: 16,
                      padding: '14px 18px',
                      borderBottom: 'var(--border)'
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
                        {tp != null && <span>Tax payable: {formatRM(tp)}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectFiling(rec)}
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
          )}
        </>
      )}

      {/* AD-2: Chat assistant (shown once a filing is selected) */}
      {selectedFiling && (
        <>
          {/* Selected filing header */}
          <div
            className="window"
            style={{
              marginBottom: 16,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
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

          {/* Suggested questions */}
          <div className="window" style={{ marginBottom: 16 }}>
            <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="titlebar-title">Suggested Questions</span>
              <InfoTip content="These questions are seeded from the actual figures in your selected filing. Tapping one sends it directly to the assistant." />
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleChip(q)}
                  disabled={chatLoading}
                  style={{
                    padding: '6px 12px',
                    border: 'var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--screen)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink)',
                    cursor: chatLoading ? 'default' : 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {q}
                </button>
              ))}

              {/* Trust Demo chip */}
              <button
                type="button"
                onClick={handleTrustDemo}
                disabled={chatLoading}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--rust)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(181,80,60,0.06)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--rust)',
                  cursor: chatLoading ? 'default' : 'pointer',
                  textAlign: 'left'
                }}
              >
                Trust Demo: inject fabricated clause
              </button>
            </div>
          </div>

          {/* Chat thread */}
          {thread.length > 0 && (
            <div className="window" style={{ marginBottom: 16 }}>
              <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="titlebar-title">Conversation</span>
                <InfoTip content="Each answer is grounded in Malaysian tax law. Citations show the exact clause IDs and source passages. Fabricated clause IDs are stamped REJECTED." />
              </div>
              <div style={{ padding: '16px 18px', display: 'grid', gap: 16 }}>
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
                      Building defense pack...
                    </span>
                  </div>
                )}
                <div ref={threadEndRef} />
              </div>
            </div>
          )}

          {/* Free-text input */}
          <div className="window">
            <div className="titlebar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="titlebar-title">Ask a Question</span>
              <InfoTip content="Ask how to justify any figure LHDN might question. The assistant grounds every answer in the law corpus and flags fabricated citations." />
            </div>
            <div style={{ padding: '14px 16px', display: 'grid', gap: 10 }}>
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
        </>
      )}
    </>
  )
}
