import type { Theme } from '../hooks/useTheme'

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

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3a6 6 0 0 1 6 6v4l1.5 2.5H4.5L6 13V9a6 6 0 0 1 6-6Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <path d="M10 18a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeLinecap="round" />
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

export function HelpCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" width="14" height="14">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 9.5a2 2 0 1 1 2.5 1.9c-.8.3-1.3.9-1.3 1.6v.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="11.2" cy="16" r="0.8" fill="currentColor" />
    </svg>
  )
}
