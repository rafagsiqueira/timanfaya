ALTER TABLE "campaigns" ALTER COLUMN "objective" SET DEFAULT 'traffic';--> statement-breakpoint
UPDATE "campaigns" SET "objective" = 'traffic' WHERE "objective" = 'whatsapp';
