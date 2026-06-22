import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="CukaiPandai home">
      <span className="grid place-items-center w-7 h-7 rounded-lg bg-accent text-accent-ink shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4.5 6h7M4.5 8.5h7M4.5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>
      <span className="display text-xl font-bold tracking-tight text-ink group-hover:text-accent transition-colors">
        CukaiPandai
      </span>
    </Link>
  );
}
