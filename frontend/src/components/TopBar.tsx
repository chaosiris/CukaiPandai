import Link from "next/link";
import { Brand } from "./Brand";
import { SovereignToggle } from "./SovereignToggle";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/obligations", label: "Obligations" },
  { href: "/filing", label: "Filing" },
  { href: "/audit-defense", label: "Audit-Defense" },
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
          <ThemeToggle />
          <Link href="/obligations" className="btn btn--primary">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
