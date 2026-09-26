import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F6F6F3",   // warmes, kühl gebrochenes Neutral (kein Creme-Klischee)
        ink: "#1C1C1A",     // fast-schwarze Tinte
        sage: "#6B7A5E",    // gedämpftes Botanik-Grün — Interior, natürlich
        brass: "#B08948",   // Messing, nur für die primäre Aktion
        mist: "#E7E7E1",    // ruhige Trennlinien / Flächen
        clay: "#9C6B4A",    // warmes Holz, sparsam als Sekundärton
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
