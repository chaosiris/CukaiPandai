import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { TopBar } from "../components/TopBar";
import "./globals.css";

const FOOTER_LINKS = [
  { href: "/entities", label: "Entities" },
  { href: "/obligations", label: "Obligations" },
  { href: "/filing", label: "Filing" },
  { href: "/audit-defense", label: "Audit-Defense" },
  { href: "/corpus", label: "Corpus" },
  { href: "/pricing", label: "Plans" },
  { href: "/faq", label: "FAQ" },
  { href: "/settings", label: "Settings" },
];

export const metadata: Metadata = {
  title: "CukaiPandai — smart tax, audit-ready",
  description:
    "Agentic, audit-defense-first tax assurance for Malaysian enterprises. Every figure cited to its source document and the exact Income Tax Act clause. Verified by the backend. Never hallucinated.",
};

// Set the theme class before paint to avoid a flash of the wrong theme.
const themeInit = `(function(){try{var t=localStorage.getItem('cp-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-8">
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {FOOTER_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-5 flex flex-col gap-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <span className="font-mono uppercase tracking-widest">CukaiPandai · NexHack 2026</span>
              <span>Every figure cited · every audit defensible · human-approved before filing.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
