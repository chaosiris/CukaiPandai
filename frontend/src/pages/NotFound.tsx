import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty-window window" style={{ maxWidth: 560, margin: '40px auto 0' }}>
      <div className="titlebar">
        <span className="closebox" aria-hidden="true" />
        <span className="titlebar-title">404 — Not Found</span>
        <span className="titlebar-meta">LOST FILE</span>
      </div>
      <div className="empty-body" style={{ padding: '32px 24px', minHeight: 220 }}>
        <span className="empty-arrow" aria-hidden="true">
          ↖
        </span>
        <div className="empty-copy">
          <span className="empty-hello">Oops.</span>
          <p style={{ marginTop: 12, fontSize: 'clamp(16px, 3vw, 22px)', lineHeight: 1.4 }}>
            That page is not in this workspace.
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              marginTop: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: 'var(--denim)',
              textDecoration: 'underline',
              textUnderlineOffset: 3
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
