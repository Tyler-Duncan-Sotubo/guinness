CREATE TABLE "spin_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"segment_code" text NOT NULL,
	"reward_id" uuid,
	"points_awarded" integer,
	"is_win" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "points_ledger" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "points_ledger" CASCADE;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "activity_id" uuid;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "points_spent" integer;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "redemptions" ADD COLUMN "fulfilled_at" timestamp;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "probability_weight" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "max_quantity" integer;--> statement-breakpoint
ALTER TABLE "spin_results" ADD CONSTRAINT "spin_results_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spin_results" ADD CONSTRAINT "spin_results_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spin_results_activity_idx" ON "spin_results" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "spin_results_reward_idx" ON "spin_results" USING btree ("reward_id");--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "redemptions_event_idx" ON "redemptions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "redemptions_activity_idx" ON "redemptions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "rewards_event_idx" ON "rewards" USING btree ("event_id");