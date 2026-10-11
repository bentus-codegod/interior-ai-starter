import Link from "next/link";

// Kopfzeile: Wortmarke links, ein Anker rechts. Bewusst schmal (64 px).
export function SiteHeader() {
  return (
    <header className="border-b border-line/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-[15px] font-medium tracking-[-0.01em]">
          Interior AI
        </Link>
        <nav className="text-sm text-muted">
          <a href="/#ablauf" className="hover:text-ink">
            So funktioniert&apos;s
          </a>
        </nav>
      </div>
    </header>
  );
}
