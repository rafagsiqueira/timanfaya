import { eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Channel } from "@/db/schema";

const { budgets, budgetAllocations, campaigns, spendEntries } = schema;

export type ChannelStats = {
  channel: Channel; allocated: number; spent: number; impressions: number; clicks: number; leads: number;
};

/** Per-budget, per-channel allocation vs. actual spend and performance. */
export async function budgetChannelStats(budgetIds: number[]): Promise<Map<number, ChannelStats[]>> {
  const out = new Map<number, ChannelStats[]>();
  if (!budgetIds.length) return out;
  const allocs = await db.select().from(budgetAllocations).where(inArray(budgetAllocations.budgetId, budgetIds));
  const spend = await db
    .select({
      budgetId: campaigns.budgetId, channel: campaigns.channel,
      spent: sql<number>`coalesce(sum(${spendEntries.amountCents}),0)::int`,
      impressions: sql<number>`coalesce(sum(${spendEntries.impressions}),0)::int`,
      clicks: sql<number>`coalesce(sum(${spendEntries.clicks}),0)::int`,
      leads: sql<number>`coalesce(sum(${spendEntries.leads}),0)::int`,
    })
    .from(spendEntries)
    .innerJoin(campaigns, eq(campaigns.id, spendEntries.campaignId))
    .where(inArray(campaigns.budgetId, budgetIds))
    .groupBy(campaigns.budgetId, campaigns.channel);
  for (const id of budgetIds) {
    out.set(id, (["instagram", "google"] as Channel[]).map((channel) => {
      const a = allocs.find((x) => x.budgetId === id && x.channel === channel);
      const s = spend.find((x) => x.budgetId === id && x.channel === channel);
      return { channel, allocated: a?.amountCents ?? 0, spent: s?.spent ?? 0,
        impressions: s?.impressions ?? 0, clicks: s?.clicks ?? 0, leads: s?.leads ?? 0 };
    }));
  }
  return out;
}

export const CHANNEL_LABEL: Record<Channel, string> = { instagram: "Instagram", google: "Google" };
export const CHANNEL_COLOR: Record<Channel, string> = { instagram: "var(--ig)", google: "var(--g)" };
export const ratio = (n: number, d: number) => (d > 0 ? n / d : null);
