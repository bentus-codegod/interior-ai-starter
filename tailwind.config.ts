import type { Config } from "tailwindcss";

// Farben kommen aus CSS-Variablen (app/globals.css), damit Hell- und
// Dunkelmodus dieselben Klassen nutzen. Semantische Namen statt Farbnamen:
// surface = Seitengrund, panel = Flächen, sunken = vertiefte Flächen,
// line = Linien, ink/muted/subtle = Text in drei Stufen, accent = die eine
// Akzentfarbe (Waldgrün), warn/danger = Zustände.
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
        "on-accent": token("on-accent"),
        warn: token("warn"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      // Eckenradien (eine feste Regel, siehe globals.css):
      // Bedienelemente 8px (rounded-lg), Flächen und Bilder 12px (rounded-xl),
      // Auswahl-Chips und runde Icon-Knöpfe voll rund (rounded-full).
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
