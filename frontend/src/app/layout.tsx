import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TopBar } from "../components/TopBar";
import "./globals.css";

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
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono uppercase tracking-widest">
              CukaiPandai · NexHack 2026
            </span>
            <span>Every figure cited · every audit defensible · human-approved before filing.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
