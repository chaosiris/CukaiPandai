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
  const [pos, setPos] = useState<{ top: number; left: number; maxWidth: number }>({
    top: 0,
    left: 0,
    maxWidth: 280
  })
  const wrapRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)

  const reposition = useCallback(() => {
    if (!wrapRef.current || !bubbleRef.current) return
    const triggerRect = wrapRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const MARGIN = 8

    // Viewport-relative max-width: ensures the bubble never exceeds the available space.
    // Written into React state (not just a DOM mutation) so it survives re-renders and is
    // correct from the very first paint after repositioning.
    const effectiveMaxWidth = Math.max(160, Math.min(280, vw - 2 * MARGIN))

    // Apply to the DOM element before measuring so getBoundingClientRect reflects wrapping.
    bubbleRef.current.style.boxSizing = 'border-box'
    bubbleRef.current.style.maxWidth = `${effectiveMaxWidth}px`
    const bubbleRect = bubbleRef.current.getBoundingClientRect()

    // Default: centre above the trigger
    let top = triggerRect.top - bubbleRect.height - 6
    let left = triggerRect.left + triggerRect.width / 2 - bubbleRect.width / 2

    // Flip below if clips top
    if (top < MARGIN) {
      top = triggerRect.bottom + 6
    }
    // Clamp vertically (bottom edge)
    if (top + bubbleRect.height > vh - MARGIN) {
      top = vh - bubbleRect.height - MARGIN
    }
    // Clamp horizontally, guarding the second clamp from pushing the bubble back off-screen.
    left = Math.max(MARGIN, Math.min(left, Math.max(MARGIN, vw - bubbleRect.width - MARGIN)))

    setPos({ top, left, maxWidth: effectiveMaxWidth })
  }, [])

  useEffect(() => {
    if (!open) return
    // Two nested rAFs: the first lets React flush the bubble into the DOM and the
    // browser perform an initial layout pass; the second runs after that first layout
    // so getBoundingClientRect() returns the real wrapped dimensions (not 0x0).
    let inner: number
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(reposition)
    })
    // Re-clamp on scroll or resize while open
    window.addEventListener('scroll', reposition, { passive: true })
    window.addEventListener('resize', reposition, { passive: true })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      window.removeEventListener('scroll', reposition)
      window.removeEventListener('resize', reposition)
    }
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
            maxWidth: pos.maxWidth,
            boxSizing: 'border-box',
            zIndex: 200,
            padding: '8px 11px',
            background: 'var(--window)',
            border: 'var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            lineHeight: 1.5,
            color: 'var(--ink-soft)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere'
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
