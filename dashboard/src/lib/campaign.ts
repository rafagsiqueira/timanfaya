export const OBJECTIVES = {
  whatsapp: "Conversas no WhatsApp",
  traffic: "Visitas ao site",
  awareness: "Alcance / divulgação",
} as const;
export type Objective = keyof typeof OBJECTIVES;

/** Inclusive number of days between two ISO dates (YYYY-MM-DD). */
export function daysInclusive(startsOn: string, endsOn: string): number {
  const ms = Date.parse(endsOn + "T00:00:00Z") - Date.parse(startsOn + "T00:00:00Z");
  return Math.floor(ms / 86_400_000) + 1;
}

/** Total a campaign can spend if it runs its whole schedule at its daily budget. */
export function plannedCents(c: { dailyBudgetCents: number | null; startsOn: string | null; endsOn: string | null }): number {
  if (!c.dailyBudgetCents || !c.startsOn || !c.endsOn) return 0;
  const days = daysInclusive(c.startsOn, c.endsOn);
  return days > 0 ? c.dailyBudgetCents * days : 0;
}

/** Link used in the ad: the base URL plus UTM tags so visits can be attributed per channel/campaign. */
export function trackedUrl(base: string, channel: string, campaignName: string): string {
  const u = new URL(base);
  u.searchParams.set("utm_source", channel === "instagram" ? "instagram" : "google");
  u.searchParams.set("utm_medium", "paid");
  u.searchParams.set("utm_campaign", campaignName.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  return u.toString();
}

/**
 * Budget guard: would adding `newPlanned` push this channel's committed spend past its allocation?
 * `committed` is the planned spend of the channel's other non-ended campaigns.
 */
export function checkChannelBudget(allocated: number, committed: number, newPlanned: number) {
  const remaining = allocated - committed;
  return { ok: newPlanned <= remaining, remaining, over: Math.max(0, newPlanned - remaining) };
}
