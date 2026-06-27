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

type SortKey = 'newest' | 'oldest' | 'tax-payable'

export default function FilingStudio() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<FilingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [filterForm, setFilterForm] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setPageError(null)
    listFilings()
      .then((recs) => {
        setRecords(recs)
        setLoading(false)
      })
      .catch((e: Error) => {
        setPageError(e.message)
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

  // Derive unique form types for the form-type filter
  const formTypes = Array.from(new Set(records.map((r) => r.computation?.form ?? r.tin).filter(Boolean)))

  // Apply filters
  let visible = records
  if (filterForm !== 'all') {
    visible = visible.filter((r) => (r.computation?.form ?? r.tin) === filterForm)
  }
  if (filterStatus !== 'all') {
    visible = visible.filter((r) => (filterStatus === 'draft' ? r.status === 'draft' : r.status === 'final'))
  }
  // Apply sort
  const sorted = [...visible]
  if (sortKey === 'oldest') {
    sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  } else if (sortKey === 'tax-payable') {
    sorted.sort((a, b) => (taxPayable(b) ?? -1) - (taxPayable(a) ?? -1))
  }
  // newest is the default API order (already newest first)

  function toggleAll() {
    if (selected.size === sorted.length && sorted.every((r) => selected.has(r.id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(sorted.map((r) => r.id)))
    }
  }

  async function handleDelete() {
    if (selected.size === 0) return
    setDeleting(true)
    setPageError(null)
    try {
      await deleteFilings(Array.from(selected))
      setRecords((prev) => prev.filter((r) => !selected.has(r.id)))
      setSelected(new Set())
    } catch (e) {
      setPageError(`Could not delete the selected filing(s): ${(e as Error).message}`)
    } finally {
      setDeleting(false)
    }
  }

  const allSelected = sorted.length > 0 && sorted.every((r) => selected.has(r.id))

  return (
    <>
      <div className="page-head">
        <h1>Filing Records</h1>
        <p className="page-kicker">
          Your saved Form C filings for YA2026, each with its full tax computation and risk assessment from the
          deterministic core.
        </p>
      </div>

      {pageError && (
        <div className="window error-window" style={{ marginTop: 16 }}>
          <div className="titlebar">
            <span className="titlebar-title">Error</span>
          </div>
          <div className="error-body">{pageError}</div>
        </div>
      )}

      {/* Filter + sort row */}
      {!loading && records.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 16,
            marginBottom: 6,
            flexWrap: 'wrap'
          }}
        >
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
            aria-label="Filter by form type"
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
            <option value="all">All forms</option>
            {formTypes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
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
            <option value="all">All statuses</option>
            <option value="draft">Pending</option>
            <option value="final">Final</option>
          </select>
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
      )}

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginTop: 4,
          marginBottom: 8,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {sorted.length > 0 && (
            <>
              <input
                type="checkbox"
                id="select-all"
                checked={allSelected}
                onChange={toggleAll}
                style={{ cursor: 'pointer' }}
                aria-label="Select all visible filings"
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

      {/* Empty state (only when the load genuinely returned no records, not on an error) */}
      {!loading && !pageError && records.length === 0 && (
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
              {sorted.length} of {records.length} Filing{records.length !== 1 ? 's' : ''}
            </span>
            <InfoTip content="Click a row to open the full record. Use checkboxes to select multiple records for deletion." />
          </div>
          {sorted.length === 0 && (
            <div
              style={{ padding: '20px 18px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}
            >
              No filings match the current filters.
            </div>
          )}
          <div className="row-div-list">
            {sorted.map((rec) => {
              const tp = taxPayable(rec)
              const rc = riskCount(rec)
              const isSelected = selected.has(rec.id)
              const isDraft = rec.status === 'draft'
              return (
                <div
                  key={rec.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 18px',
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
                        {isDraft && (
                          <span
                            style={{
                              padding: '1px 6px',
                              border: '1px solid var(--mustard)',
                              color: 'var(--mustard)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em'
                            }}
                          >
                            Pending
                          </span>
                        )}
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
                            RM {tp.toLocaleString('en-MY')}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>
                          N/A
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
