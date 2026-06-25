// UI-1 — Reusable floating Tooltip + InfoTip primitive.
// Opens on hover AND keyboard focus. Dismisses on blur / mouse-leave / Escape.
// Edge-aware: repositions to avoid viewport clipping.
// a11y: trigger is a real focusable element; bubble linked via aria-describedby.
// Token-CSS only: reuses --window / --ink-soft / --border / --shadow / --radius.
// No browser-native title=. No new dependency.

import { useCallback, useEffect, useId, useRef, useState } from 'react'

// ---- Tooltip ---------------------------------------------------------------

interface TooltipProps {
  /** The element that triggers the tooltip (must be focusable). */
  trigger: React.ReactNode
  /** Tooltip content. */
  content: React.ReactNode
  /** Optional extra class on the wrapper span. */
  className?: string
}

export function Tooltip({ trigger, content, className }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    if (!wrapRef.current || !bubbleRef.current) return
    const triggerRect = wrapRef.current.getBoundingClientRect()
    const bubbleRect = bubbleRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const MARGIN = 8

    // Default: centre above the trigger
    let top = triggerRect.top - bubbleRect.height - 6
    let left = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2

    // Flip below if clips top
    if (top < MARGIN) {
      top = triggerRect.bottom + 6
    }
    // Clamp horizontally
    if (left < MARGIN) left = MARGIN
    if (left + bubbleRect.width > vw - MARGIN) left = vw - bubbleRect.width - MARGIN

    setPos({ top, left })
  }, [])

  useEffect(() => {
    if (!open) return
    // Position on next paint once bubble is in the DOM
    const frame = requestAnimationFrame(reposition)
    return () => cancelAnimationFrame(frame)
  }, [open, reposition])

  // Dismiss on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <span
      ref={wrapRef}
      className={className}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      {/* Wrap trigger with aria-describedby pointing at the bubble */}
      <span aria-describedby={open ? id : undefined} style={{ display: 'inline-flex', alignItems: 'center' }}>
        {trigger}
      </span>

      {open && (
        <div
          ref={bubbleRef}
          id={id}
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 200,
            maxWidth: 280,
            padding: '8px 11px',
            background: 'var(--window)',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--ink-soft)',
            pointerEvents: 'none'
          }}
        >
          {content}
        </div>
      )}
    </span>
  )
}

// ---- InfoTip ---------------------------------------------------------------
// A small circled-i button that shows a Tooltip on hover/focus.

interface InfoTipProps {
  /** Tooltip content. */
  content: React.ReactNode
  /** aria-label for the button (defaults to "More information"). */
  label?: string
}

export function InfoTip({ content, label = 'More information' }: InfoTipProps) {
  return (
    <Tooltip
      trigger={
        <button
          type="button"
          aria-label={label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            padding: 0,
            border: '1px solid var(--ink-soft)',
            borderRadius: '50%',
            background: 'transparent',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
            cursor: 'default',
            flexShrink: 0
          }}
        >
          i
        </button>
      }
      content={content}
    />
  )
}
