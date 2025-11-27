CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"kickoff_at" timestamp NOT NULL,
	"external_fixture_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "predictions"
  ALTER COLUMN "match_id" TYPE uuid
  USING "match_id"::uuid;
--> statement-breakpoint
CREATE INDEX "matches_event_idx" ON "matches" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "matches_external_fixture_idx" ON "matches" USING btree ("external_fixture_id");--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;