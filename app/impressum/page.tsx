import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Interior AI",
};

// ⚠️ ENTWURF — vor der Veröffentlichung ausfüllen und rechtlich prüfen lassen.
// Pflichtangaben nach § 5 DDG (früher § 5 TMG). Alle [[…]]-Felder ersetzen.
export default function Impressum() {
  return (
    <main className="mx-auto max-w-prose px-6 py-14 sm:py-20">
      <div className="mb-8 rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm text-muted">
        <strong className="font-semibold tracking-tight">Entwurf.</strong> Diese Seite muss vor
        dem öffentlichen Start ausgefüllt und rechtlich geprüft werden. Die
        markierten Felder [[…]] sind Platzhalter.
      </div>

      <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl">Impressum</h1>

      <div className="mt-8 space-y-6 text-muted">
        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">
            Angaben gemäß § 5 DDG
          </h2>
          <p className="mt-2">
            [[Name / Firma]]
            <br />
            [[Straße und Hausnummer]]
            <br />
            [[PLZ und Ort]]
          </p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">Vertreten durch</h2>
          <p className="mt-2">[[Name der vertretungsberechtigten Person]]</p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">Kontakt</h2>
          <p className="mt-2">
            E-Mail: [[kontakt@deine-domain.de]]
            <br />
            Telefon: [[optional]]
          </p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">
            Umsatzsteuer-ID / Registereintrag
          </h2>
          <p className="mt-2">
            [[falls vorhanden — USt-IdNr., Handelsregister, Registergericht]]
          </p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">
            Verantwortlich für den Inhalt
          </h2>
          <p className="mt-2">[[Name und Anschrift wie oben]]</p>
        </section>
      </div>
    </main>
  );
}
