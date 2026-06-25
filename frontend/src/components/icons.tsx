import type { Theme } from '../hooks/useTheme'

// Inline SVG logo mark — a stylised ledger/document stamp motif.
// Drawn in currentColor: inherits --ink in topbar, --paper in footer.
// No image asset required; no public/ dir dependency.
export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: parent span is aria-hidden */}
      <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" width="30" height="30">
        {/* Outer document rectangle */}
        <rect x="5" y="2" width="20" height="26" rx="1" stroke="currentColor" strokeWidth="1.5" />
        {/* Folded corner */}
        <polyline points="18,2 18,8 24,8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Three ruled lines (ledger rows) */}
        <line x1="8" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="17" x2="22" y2="17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Verification tick at bottom-right */}
        <polyline
          points="17,21 19,23 23,19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 14.2A7.2 7.2 0 0 1 9.8 4a7.6 7.6 0 1 0 10.2 10.2Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" />
      <circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" />
      <path d="M6.8 19a5.6 5.6 0 0 1 10.4 0" fill="none" stroke="currentColor" strokeLinecap="round" />
    </svg>
  )
}
