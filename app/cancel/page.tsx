export default function Cancel() {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-prose place-items-center px-6 text-center">
      <div>
        <h1 className="text-4xl font-medium tracking-tight">Checkout abgebrochen.</h1>
        <p className="mt-4 text-muted">Kein Problem. Dein Look wartet auf dich.</p>
        <a href="/" className="mt-6 inline-block text-accent underline underline-offset-4">
          Zurück zum Start
        </a>
      </div>
    </main>
  );
}
