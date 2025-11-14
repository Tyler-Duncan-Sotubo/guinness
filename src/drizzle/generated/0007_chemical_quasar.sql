CREATE TABLE "user_event_spins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"total_spins" integer DEFAULT 0 NOT NULL,
	"spins_today" integer DEFAULT 0 NOT NULL,
	"spins_today_date" timestamp,
	"last_spin_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "user_event_spins" ADD CONSTRAINT "user_event_spins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_event_spins" ADD CONSTRAINT "user_event_spins_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_event_spins_user_event_key" ON "user_event_spins" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "user_event_spins_user_idx" ON "user_event_spins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_event_spins_event_idx" ON "user_event_spins" USING btree ("event_id");