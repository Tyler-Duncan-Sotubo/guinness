ALTER TABLE "events" ALTER COLUMN "starts_at" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "ends_at" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "ends_at" SET NOT NULL;