import { relations } from "drizzle-orm";
import {
  date, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";

// All money is stored as integer cents (BRL by default) to avoid float drift.

export const channelEnum = pgEnum("channel", ["instagram", "google"]);
export const campaignStatusEnum = pgEnum("campaign_status", ["draft", "active", "paused", "ended"]);
export const propertyStatusEnum = pgEnum("property_status", ["for_sale", "sold"]);

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  siteUrl: text("site_url"),
  askingPriceCents: integer("asking_price_cents"),
  status: propertyStatusEnum("status").notNull().default("for_sale"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("budgets_property_idx").on(t.propertyId)],
);

// How a budget is split between channels. Invariant (enforced in the app):
// sum(amountCents) over a budget's allocations == budgets.totalCents.
export const budgetAllocations = pgTable(
  "budget_allocations",
  {
    id: serial("id").primaryKey(),
    budgetId: integer("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull(),
    amountCents: integer("amount_cents").notNull(),
  },
  (t) => [uniqueIndex("budget_channel_uq").on(t.budgetId, t.channel)],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: serial("id").primaryKey(),
    budgetId: integer("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull(),
    name: text("name").notNull(),
    status: campaignStatusEnum("status").notNull().default("active"),
    externalId: text("external_id"), // id in Meta/Google Ads, for future API sync
    // Campaign plan (what will be published to the ad platform)
    objective: text("objective").notNull().default("traffic"), // traffic | awareness
    dailyBudgetCents: integer("daily_budget_cents"),
    startsOn: date("starts_on", { mode: "string" }),
    endsOn: date("ends_on", { mode: "string" }),
    locations: text("locations"), // comma-separated, e.g. "Brasil"
    ageMin: integer("age_min"),
    ageMax: integer("age_max"),
    audience: text("audience"), // interests (Instagram) or keywords (Google), comma-separated
    headline: text("headline"),
    bodyText: text("body_text"),
    linkUrl: text("link_url"),
    creativeUrl: text("creative_url"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("campaigns_budget_idx").on(t.budgetId)],
);

export const spendEntries = pgTable(
  "spend_entries",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
    spentOn: date("spent_on", { mode: "string" }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    impressions: integer("impressions").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("spend_campaign_idx").on(t.campaignId, t.spentOn)],
);

export const propertiesRelations = relations(properties, ({ many }) => ({ budgets: many(budgets) }));
export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  property: one(properties, { fields: [budgets.propertyId], references: [properties.id] }),
  allocations: many(budgetAllocations),
  campaigns: many(campaigns),
}));
export const allocationsRelations = relations(budgetAllocations, ({ one }) => ({
  budget: one(budgets, { fields: [budgetAllocations.budgetId], references: [budgets.id] }),
}));
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  budget: one(budgets, { fields: [campaigns.budgetId], references: [budgets.id] }),
  spend: many(spendEntries),
}));
export const spendRelations = relations(spendEntries, ({ one }) => ({
  campaign: one(campaigns, { fields: [spendEntries.campaignId], references: [campaigns.id] }),
}));

export type Channel = (typeof channelEnum.enumValues)[number];
export const CHANNELS = channelEnum.enumValues;
