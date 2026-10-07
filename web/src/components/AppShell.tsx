"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "/listen", label: "Listen" },
  { href: "/", label: "Events" },
  { href: "/keywords", label: "Keywords" },
  { href: "/devices", label: "Devices" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [standalone, setStandalone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const is =
      nav.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    setStandalone(is);
    document.documentElement.classList.toggle("standalone-app", is);
  }, []);

  return (
    <>
      <header
        className={
          standalone
            ? "border-b border-zinc-800 bg-zinc-950 pt-[env(safe-area-inset-top)]"
            : "border-b border-zinc-800 bg-zinc-900/80"
        }
      >
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <a href="/" className="text-lg font-semibold tracking-tight">
            Listener
          </a>
          <nav className="ml-auto hidden items-center gap-4 text-sm text-zinc-300 sm:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={
                  l.href === "/listen"
                    ? "font-medium text-sky-400 hover:text-sky-300"
                    : "hover:text-white"
                }
              >
                {l.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-200 hover:bg-zinc-800 sm:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              {menuOpen ? (
                <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5z" />
              ) : (
                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
              )}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-zinc-800 px-4 py-2 sm:hidden">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="block rounded-lg px-3 py-3 text-base text-zinc-200 hover:bg-zinc-800"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main
        className={
          standalone
            ? "min-h-[calc(100dvh-3.5rem)] bg-zinc-950 px-4 pb-8 pt-4"
            : "mx-auto max-w-5xl px-4 py-8"
        }
      >
        {children}
      </main>
    </>
  );
}
