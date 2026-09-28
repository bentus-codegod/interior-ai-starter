import Link from "next/link";

// Fußzeile mit den Pflicht-Links (Impressum, Datenschutz) und einem
// ehrlichen Hinweis zum Umgang mit den Raumfotos. Gehört auf jede Seite,
// sobald die Anwendung öffentlich erreichbar ist.
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-mist">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-xs text-ink/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Deine Raumfotos werden nur zur Gestaltung deines Raums verarbeitet.
          Details in der{" "}
          <Link href="/datenschutz" className="underline hover:text-ink/80">
            Datenschutzerklärung
          </Link>
          .
        </p>
        <nav className="flex gap-5">
          <Link href="/impressum" className="hover:text-ink/80">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-ink/80">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
