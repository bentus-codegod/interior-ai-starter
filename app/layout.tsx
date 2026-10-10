import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

// Eine Schriftfamilie für alles (Werkzeug-Oberfläche, Impeccable), Mono
// nur für Zahlen/Maße. Geist wird lokal aus dem npm-Paket ausgeliefert.

export const metadata: Metadata = {
  title: "Interior AI: dein Raum, fertig eingerichtet",
  description:
    "Lade ein Foto deines Raums hoch, wähle Stil und Budget und kaufe den ganzen Look mit einem Klick.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1110" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-[100dvh] bg-surface font-sans text-ink antialiased">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
