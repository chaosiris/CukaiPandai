// FM-1 — /filing records dashboard.
// Lists the user's saved filing records (newest first).
// Single-click a row → /filing/[id]. Checkboxes + Delete action for multi-select.
// "New Filing" CTA → /filing/new. Empty state + loading barber strip.

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { type FilingRecord, deleteFilings, listFilings } from '../api/client'
import { InfoTip } from '../components/Tooltip'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function taxPayable(rec: FilingRecord): number | null {
  return rec.computation?.fields?.tax_payable?.value ?? null
}

function riskCount(rec: FilingRecord): number {
  return rec.risk_flags?.length ?? 0
}

export default function FilingStudio() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<FilingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    listFilings()
      .then((recs) => {
        setRecords(recs)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === records.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(records.map((r) => r.id)))
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      await deleteFilings(Array.from(selected))
      setRecords((prev) => prev.filter((r) => !selected.has(r.id)))
      setSelected(new Set())
    } finally {
      setDeleting(false)
    }
  }

  const allSelected = records.length > 0 && selected.size === records.length

  return (
    <>
      <div className="page-head">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Filing Records
          <InfoTip content="Your saved Form C filings for YA2026. Each record stores the full tax computation and risk assessment produced by the deterministic core." />
        </h1>
        <p className="page-kicker">Saved Form C computations -- one-shot, rule-based, citation-grounded</p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 16,
          marginBottom: 8,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {records.length > 0 && (
            <>
              <input
                type="checkbox"
                id="select-all"
                checked={allSelected}
                onChange={toggleAll}
                style={{ cursor: 'pointer' }}
                aria-label="Select all filings"
              />
              <label
                htmlFor="select-all"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--ink-soft)',
                  cursor: 'pointer'
                }}
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </label>
            </>
          )}
          {selected.size > 0 && (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              style={{
                padding: '5px 14px',
                border: '1px solid var(--rust)',
                background: 'transparent',
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
            borderRadius: 'var(--radius)',
            border: 'none'
          }}
        >
          + New Filing
        </Link>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="window" style={{ marginTop: 8 }}>
          <div className="titlebar">
            <span className="titlebar-title">Filing Records</span>
            <div className="barber" style={{ width: 80, height: 4, flexShrink: 0 }} />
          </div>
          <div style={{ padding: '24px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>
            Loading...
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && records.length === 0 && (
        <div
          className="window"
          style={{
            marginTop: 8,
            padding: '48px 24px',
            textAlign: 'center',
            display: 'grid',
            gap: 16
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--ink-soft)',
              lineHeight: 1.6
            }}
          >
            No filings yet. Create your first to see your tax computation here.
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
              Create Your First Filing
            </Link>
          </div>
        </div>
      )}

      {/* Records list */}
      {!loading && records.length > 0 && (
        <div className="window" style={{ marginTop: 8 }}>
          <div className="titlebar">
            <span className="titlebar-title">
              {records.length} Filing{records.length !== 1 ? 's' : ''}
            </span>
            <InfoTip content="Newest filing appears first. Click a row to open the full record. Use checkboxes to select multiple records for deletion." />
          </div>
          {records.map((rec) => {
            const tp = taxPayable(rec)
            const rc = riskCount(rec)
            const isSelected = selected.has(rec.id)
            return (
              <div
                key={rec.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  borderBottom: 'var(--border)',
                  background: isSelected ? 'var(--screen)' : 'transparent',
                  transition: 'background 150ms'
                }}
              >
                {/* Checkbox cell */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(rec.id)}
                    style={{ cursor: 'pointer' }}
                    aria-label={`Select ${rec.label}`}
                  />
                </div>

                {/* Label + meta + tax payable: all link to the record */}
                <Link
                  to={`/filing/${rec.id}`}
                  style={{
                    display: 'contents',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--ink)',
                        lineHeight: 1.3,
                        marginBottom: 3
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
                      {rc > 0 && (
                        <span style={{ color: 'var(--rust)' }}>
                          {rc} risk flag{rc !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {tp != null ? (
                      <>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--ink-soft)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 2
                          }}
                        >
                          Tax Payable
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 18,
                            fontWeight: 700,
                            color: 'var(--ink)'
                          }}
                        >
                          RM {tp.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>N/A</div>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
