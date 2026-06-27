// Skeleton — reusable loading placeholder primitives.
// Uses the .skeleton CSS class from tokens.css for the shimmer animation.
// Respects .reduce-motion (class on <html>) and prefers-reduced-motion (media query):
// in either case the shimmer freezes to a static muted block (see tokens.css).

/** A single rectangular skeleton block. Mimics a card, image, or content area. */
export function Skeleton({
  height,
  width,
  style
}: {
  height?: number | string
  width?: number | string
  style?: React.CSSProperties
}) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{
        height: height ?? 16,
        width: width ?? '100%',
        ...style
      }}
    />
  )
}

/** A stack of skeleton text lines. Each line is a narrow rectangle at typical text height. */
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <span aria-hidden="true" style={{ display: 'grid', gap, width: '100%' }}>
      {Array.from({ length: lines }, (_, i) => {
        const isLast = i === lines - 1
        return (
          <Skeleton
            key={`skt-${i}-${isLast ? 'last' : 'full'}`}
            height={12}
            // Last line is shorter to mimic natural paragraph end
            width={isLast ? '65%' : '100%'}
          />
        )
      })}
    </span>
  )
}

/** A skeleton that mimics a .window card with an optional titlebar and body. */
export function SkeletonCard({
  titleWidth = '40%',
  bodyLines = 2,
  bodyHeight,
  style
}: {
  titleWidth?: string | number
  bodyLines?: number
  bodyHeight?: number | string
  style?: React.CSSProperties
}) {
  return (
    <div className="window" style={style} aria-hidden="true">
      <div className="titlebar">
        <span className="closebox" />
        <Skeleton height={14} width={titleWidth} />
      </div>
      <div style={{ padding: '16px 18px', display: 'grid', gap: 10 }}>
        {bodyHeight != null ? <Skeleton height={bodyHeight} /> : <SkeletonText lines={bodyLines} />}
      </div>
    </div>
  )
}
