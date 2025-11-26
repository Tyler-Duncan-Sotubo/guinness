CREATE TABLE "predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"match_id" text NOT NULL,
	"home_score" integer NOT NULL,
	"away_score" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "predictions_registration_match_uq" ON "predictions" USING btree ("registration_id","match_id");--> statement-breakpoint
CREATE INDEX "predictions_event_match_idx" ON "predictions" USING btree ("event_id","match_id");