// CitationPanel — shared primitive used by FE-3 (Filing Studio) and FE-4 (Audit Defense).
// Renders a single Citation with a verified/unverified badge and an expandable <details>
// panel for clause IDs and RAG provenance fields (section, page_ref, url, passage).
// All RAG fields are optional — the component guards every access.

import type { Citation } from '../api/client'

interface CitationPanelProps {
  citation: Citation
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span className={verified ? 'verified-stamp' : 'verified-stamp unverified-stamp'}>
      {verified ? 'VERIFIED' : 'REJECTED'}
    </span>
  )
}

export function SovereignBadge({ sovereign, model }: { sovereign: boolean; model: string }) {
  const label = sovereign ? `ILMU · ${model}` : `EXTERNAL · ${model}`
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        padding: '2px 6px',
        border: sovereign ? '1px solid var(--denim)' : '1px solid var(--ink-soft)',
        color: sovereign ? 'var(--denim)' : 'var(--ink-soft)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap'
      }}
    >
      {label}
    </span>
  )
}

export function CitationPanel({ citation }: CitationPanelProps) {
  const hasProvenance = citation.section ?? citation.page_ref ?? citation.url ?? citation.passage

  return (
    <li key={citation.claim} className="requirement-row" style={{ padding: '12px 18px' }}>
      <div className="evidence">
        <span className="evidence-line">{citation.claim}</span>
        <VerifiedBadge verified={citation.verified} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--ink-soft)',
          paddingTop: 4,
          paddingLeft: 10
        }}
      >
        {citation.clause_ids.join(', ')}
      </div>
      {hasProvenance && (
        <details style={{ paddingTop: 6, paddingLeft: 10 }}>
          <summary
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--denim)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Source detail
          </summary>
          <div
            style={{
              paddingTop: 8,
              paddingLeft: 12,
              display: 'grid',
              gap: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-soft)'
            }}
          >
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
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--denim)', textDecoration: 'underline' }}
                >
                  {citation.url}
                </a>
              </div>
            )}
            {citation.passage && (
              <div
                style={{
                  marginTop: 4,
                  borderLeft: '2px solid var(--grid)',
                  paddingLeft: 8,
                  color: 'var(--ink)',
                  fontStyle: 'italic'
                }}
              >
                {citation.passage}
              </div>
            )}
          </div>
        </details>
      )}
    </li>
  )
}
