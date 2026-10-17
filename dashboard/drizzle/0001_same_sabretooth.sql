ALTER TABLE "campaigns" ADD COLUMN "objective" text DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "daily_budget_cents" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "starts_on" date;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "ends_on" date;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "locations" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "age_min" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "age_max" integer;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "audience" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "body_text" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "link_url" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "creative_url" text;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "last_error" text;