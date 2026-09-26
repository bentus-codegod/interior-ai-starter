export default function Success() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-prose place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-4xl">Danke für deine Bestellung.</h1>
        <p className="mt-4 text-ink/70">
          Das ist die Erfolgsseite nach dem Stripe-Test-Checkout. Hier würdest du
          später die echte Bestellbestätigung und das Fulfillment anstoßen.
        </p>
        <a href="/" className="mt-6 inline-block text-sage underline underline-offset-4">
          Zurück zum Start
        </a>
      </div>
    </main>
  );
}
