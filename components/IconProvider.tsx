"use client";

import { IconContext } from "@phosphor-icons/react";

// Alle Phosphor-Icons in derselben feinen Strichstärke (Taste: eine
// Familie, ein Gewicht). Einzelne Icons können "fill" o. ä. überschreiben.
export function IconProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: "light", size: 18 }}>{children}</IconContext.Provider>
  );
}
