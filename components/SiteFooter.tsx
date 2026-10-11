import Link from "next/link";

// Fußzeile mit den Pflicht-Links (Impressum, Datenschutz) und einem
// ehrlichen Hinweis zum Umgang mit den Raumfotos.
export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-prose">
          Deine Fotos nutzen wir nur, um deinen Raum zu gestalten. Mehr dazu in der{" "}
          <Link href="/datenschutz" className="underline hover:text-ink">
            Datenschutzerklärung
          </Link>
          .
        </p>
        <nav className="flex gap-5">
          <Link href="/impressum" className="hover:text-ink">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-ink">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
