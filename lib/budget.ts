export type BudgetSplit = {
  budgetCents: number; // Gesamtbudget des Nutzers (0 = ohne Limit)
  logisticsCents: number; // davon für Logistik/Lieferung reserviert
  furnitureBudgetCents: number; // davon für Möbel & Deko
};

// Teilt das Gesamtbudget in Logistik und Möbel (siehe LOGISTICS_SHARE).
// Beispiel aus dem Konzept: 20.000 € bei 0,4 -> 8.000 € Logistik,
// 12.000 € für die Einrichtung.
export function splitBudget(budgetCents: number, logisticsShare: number): BudgetSplit {
  if (budgetCents <= 0) {
    return { budgetCents: 0, logisticsCents: 0, furnitureBudgetCents: 0 };
  }
  const share = Math.min(0.6, Math.max(0, logisticsShare));
  const logisticsCents = Math.round(budgetCents * share);
  return { budgetCents, logisticsCents, furnitureBudgetCents: budgetCents - logisticsCents };
}
