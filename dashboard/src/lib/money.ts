/** Parse pt-BR or plain user input ("1.500,50", "1500.5", "R$ 2.000") into integer cents. */
export function parseBRL(input: string): number | null {
  let s = input.replace(/[R$\s]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) ?? []).length > 1 || /\.\d{3}$/.test(s)) s = s.replace(/\./g, ""); // "1.500" = 1500
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Split `totalCents` between two channels. `firstPct` (0-100) goes to the first;
 * the second gets the exact remainder so the parts always sum to the total.
 */
export function splitTwoWays(totalCents: number, firstPct: number): [number, number] {
  const pct = Math.min(100, Math.max(0, firstPct));
  const first = Math.round((totalCents * pct) / 100);
  return [first, totalCents - first];
}
