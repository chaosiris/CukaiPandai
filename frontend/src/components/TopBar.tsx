import Link from "next/link";
import { Brand } from "./Brand";
import { SovereignToggle } from "./SovereignToggle";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/entities", label: "Entities" },
  { href: "/obligations", label: "Obligations" },
  { href: "/filing", label: "Filing" },
  { href: "/audit-defense", label: "Audit-Defense" },
  { href: "/corpus", label: "Corpus" },
];

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Brand />
        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline">
            <SovereignToggle />
          </span>
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className="btn btn--ghost !px-2.5 !py-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12 2.8v2.3M12 18.9v2.3M21.2 12h-2.3M5.1 12H2.8M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          <ThemeToggle />
          <Link href="/obligations" className="btn btn--primary">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
