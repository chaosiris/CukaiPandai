export function WindowGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect x="1" y="1" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="4" y="4" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
