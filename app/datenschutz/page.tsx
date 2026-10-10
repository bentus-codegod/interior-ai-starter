import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Interior AI",
};

// ⚠️ ENTWURF — vor der Veröffentlichung von einer fachkundigen Person (z. B.
// Anwalt/Datenschutzberatung) prüfen lassen. Der Text beschreibt ehrlich, was
// die App technisch tut; die [[…]]-Felder und die konkrete Rechtsgrundlage
// müssen ergänzt werden.
export default function Datenschutz() {
  return (
    <main className="mx-auto max-w-prose px-6 py-14 sm:py-20">
      <div className="mb-8 rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm text-muted">
        <strong className="font-semibold tracking-tight">Entwurf.</strong> Diese Datenschutz­-
        erklärung ist eine ehrliche Beschreibung der Technik, aber noch kein
        rechtsgeprüfter Text. Vor dem öffentlichen Start prüfen lassen.
      </div>

      <h1 className="font-semibold tracking-tight text-3xl sm:text-4xl">Datenschutzerklärung</h1>

      <div className="mt-8 space-y-6 text-muted">
        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">Verantwortlicher</h2>
          <p className="mt-2">[[Name / Firma und Anschrift — wie im Impressum]]</p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">
            Welche Daten wir verarbeiten
          </h2>
          <p className="mt-2">
            <strong>Raumfotos.</strong> Wenn du ein Foto deines Raums hochlädst,
            wird es an unseren Bild-Dienst übermittelt, um daraus ein neu
            gestaltetes Bild zu erzeugen. Fotos können ungewollt Personen oder
            persönliche Gegenstände zeigen — lade nur Bilder hoch, bei denen das
            in Ordnung ist.
          </p>
          <p className="mt-2">
            <strong>Technische Daten.</strong> Zum Schutz vor Missbrauch
            verarbeiten wir vorübergehend deine IP-Adresse (Begrenzung der
            Anfragen pro Nutzer).
          </p>
          <p className="mt-2">
            <strong>Eingaben.</strong> Optionale Raummaße und Budget, die du
            selbst eingibst.
          </p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">
            Auftragsverarbeiter / Dienste
          </h2>
          <p className="mt-2">
            Für Betrieb und Bildverarbeitung nutzen wir externe Dienste. Mit
            diesen ist jeweils ein Vertrag zur Auftragsverarbeitung nötig:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>[[Hosting: z. B. Vercel]]</li>
            <li>[[Bild-KI: z. B. eigener RunPod-Server / ComfyUI]]</li>
            <li>[[Zahlungen: z. B. Stripe — falls aktiv]]</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">Speicherdauer</h2>
          <p className="mt-2">
            [[Konkret angeben: Wie lange werden Fotos und Ergebnisse
            aufbewahrt? Wenn nicht dauerhaft gespeichert wird, hier klar sagen.]]
          </p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">Rechtsgrundlage</h2>
          <p className="mt-2">
            [[Art. 6 DSGVO — je nach Fall Einwilligung oder Vertragserfüllung;
            von fachkundiger Person bestimmen lassen.]]
          </p>
        </section>

        <section>
          <h2 className="font-semibold tracking-tight text-sm text-muted">Deine Rechte</h2>
          <p className="mt-2">
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
            der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das
            Recht, dich bei einer Aufsichtsbehörde zu beschweren. Kontakt:
            [[E-Mail]].
          </p>
        </section>
      </div>
    </main>
  );
}
