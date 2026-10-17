"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { parseBRL, splitTwoWays } from "@/lib/money";

const { properties, budgets, budgetAllocations, campaigns, spendEntries } = schema;

const money = z.string().transform((s, ctx) => {
  const c = parseBRL(s);
  if (c === null || c <= 0) { ctx.addIssue({ code: "custom", message: "Valor inválido" }); return z.NEVER; }
  return c;
});
const optInt = z.coerce.number().int().min(0).default(0);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function createProperty(formData: FormData) {
  const d = z.object({
    name: z.string().trim().min(1),
    location: z.string().trim().optional(),
    siteUrl: z.string().trim().url().optional().or(z.literal("")),
    askingPrice: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  const [row] = await db.insert(properties).values({
    name: d.name,
    slug: slugify(d.name),
    location: d.location || null,
    siteUrl: d.siteUrl || null,
    askingPriceCents: d.askingPrice ? parseBRL(d.askingPrice) : null,
  }).returning({ id: properties.id });
  revalidatePath("/");
  redirect(`/properties/${row.id}`);
}

export async function createBudget(propertyId: number, formData: FormData) {
  const d = z.object({
    name: z.string().trim().min(1),
    total: money,
    instagramPct: z.coerce.number().min(0).max(100),
    startsOn: isoDate,
    endsOn: isoDate.optional().or(z.literal("")),
  }).parse(Object.fromEntries(formData));
  const [ig, google] = splitTwoWays(d.total, d.instagramPct);
  const [b] = await db.insert(budgets).values({
    propertyId, name: d.name, totalCents: d.total, startsOn: d.startsOn, endsOn: d.endsOn || null,
  }).returning({ id: budgets.id });
  try {
    await db.insert(budgetAllocations).values([
      { budgetId: b.id, channel: "instagram", amountCents: ig },
      { budgetId: b.id, channel: "google", amountCents: google },
    ]);
  } catch (e) {
    await db.delete(budgets).where(eq(budgets.id, b.id)); // neon-http has no transactions: compensate
    throw e;
  }
  revalidatePath(`/properties/${propertyId}`);
}

/** Change a budget's total and/or its Instagram/Google split in one go. */
export async function updateBudget(budgetId: number, propertyId: number, formData: FormData) {
  const d = z.object({ total: money, instagramPct: z.coerce.number().min(0).max(100) })
    .parse(Object.fromEntries(formData));
  const [ig, google] = splitTwoWays(d.total, d.instagramPct);
  await db.update(budgets).set({ totalCents: d.total }).where(eq(budgets.id, budgetId));
  await db.insert(budgetAllocations).values([
    { budgetId, channel: "instagram", amountCents: ig },
    { budgetId, channel: "google", amountCents: google },
  ]).onConflictDoUpdate({
    target: [budgetAllocations.budgetId, budgetAllocations.channel],
    set: { amountCents: sql`excluded.amount_cents` },
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function deleteBudget(budgetId: number, propertyId: number) {
  await db.delete(budgets).where(eq(budgets.id, budgetId));
  revalidatePath(`/properties/${propertyId}`);
}

export async function createCampaign(budgetId: number, propertyId: number, formData: FormData) {
  const d = z.object({
    name: z.string().trim().min(1),
    channel: z.enum(["instagram", "google"]),
    externalId: z.string().trim().optional(),
  }).parse(Object.fromEntries(formData));
  await db.insert(campaigns).values({ budgetId, name: d.name, channel: d.channel, externalId: d.externalId || null });
  revalidatePath(`/properties/${propertyId}`);
}

export async function setCampaignStatus(campaignId: number, propertyId: number, formData: FormData) {
  const status = z.enum(["draft", "active", "paused", "ended"]).parse(formData.get("status"));
  await db.update(campaigns).set({ status }).where(eq(campaigns.id, campaignId));
  revalidatePath(`/properties/${propertyId}`);
}

export async function addSpend(propertyId: number, formData: FormData) {
  const d = z.object({
    campaignId: z.coerce.number().int(),
    spentOn: isoDate,
    amount: money,
    impressions: optInt, clicks: optInt, leads: optInt,
    note: z.string().trim().optional(),
  }).parse(Object.fromEntries(formData));
  // Make sure the campaign belongs to this property before writing.
  const owned = await db.select({ id: campaigns.id }).from(campaigns)
    .innerJoin(budgets, eq(budgets.id, campaigns.budgetId))
    .where(and(eq(campaigns.id, d.campaignId), eq(budgets.propertyId, propertyId)));
  if (!owned.length) throw new Error("Campanha não encontrada");
  await db.insert(spendEntries).values({
    campaignId: d.campaignId, spentOn: d.spentOn, amountCents: d.amount,
    impressions: d.impressions, clicks: d.clicks, leads: d.leads, note: d.note || null,
  });
  revalidatePath(`/properties/${propertyId}`);
}

export async function deleteSpend(spendId: number, propertyId: number) {
  await db.delete(spendEntries).where(eq(spendEntries.id, spendId));
  revalidatePath(`/properties/${propertyId}`);
}
