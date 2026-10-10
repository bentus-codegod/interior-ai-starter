import type { Config } from "tailwindcss";

// Farben kommen aus CSS-Variablen (app/globals.css), damit Hell- und
// Dunkelmodus dieselben Klassen nutzen. Semantische Namen statt Farbnamen:
// surface = Seitengrund, panel = Flächen, sunken = vertiefte Flächen,
// line = Linien, ink/muted/subtle = Text in drei Stufen (ink auch für
// Hauptknöpfe), accent = gedämpftes Salbei, tint = Salbei-Pastell als
// Fläche, warn/danger = Zustände.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: token("surface"),
        panel: token("panel"),
        sunken: token("sunken"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        subtle: token("subtle"),
        accent: token("accent"),
        tint: token("tint"),
        "on-accent": token("on-accent"),
        warn: token("warn"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      // Eckenradius (eine feste Regel, siehe globals.css): alles 6px
      // (rounded-md), Auswahl-Chips und runde Icon-Knöpfe voll rund.
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
      },
      maxWidth: {
        prose: "65ch",
      },
    },
  },
  plugins: [],
};

export default config;
