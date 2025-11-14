CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location_id" uuid NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"is_epic" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'published' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" text NOT NULL,
	"captured_at" timestamp DEFAULT now(),
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"type_id" uuid NOT NULL,
	"payload" text,
	"occurred_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid NOT NULL,
	"event_id" uuid,
	"reason" text NOT NULL,
	"points" integer NOT NULL,
	"occurred_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"event_id" uuid,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"cost" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"ics_url" text,
	"sent_at" timestamp,
	"status" text DEFAULT 'queued'
);
--> statement-breakpoint
CREATE TABLE "email_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp,
	"confirmed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"source" text DEFAULT 'online' NOT NULL,
	"accepted_terms" boolean DEFAULT false NOT NULL,
	"accepted_marketing" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_type_id_activity_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."activity_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemptions" ADD CONSTRAINT "redemptions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_invites" ADD CONSTRAINT "calendar_invites_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_confirmations" ADD CONSTRAINT "email_confirmations_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_location_idx" ON "events" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "events_starts_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_location_start_uq" ON "events" USING btree ("location_id","starts_at");--> statement-breakpoint
CREATE INDEX "attendees_email_idx" ON "attendees" USING btree ("email");--> statement-breakpoint
CREATE INDEX "consents_registration_idx" ON "consents" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "consents_type_idx" ON "consents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activities_event_idx" ON "activities" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "activities_attendee_idx" ON "activities" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "activity_types_code_idx" ON "activity_types" USING btree ("code");--> statement-breakpoint
CREATE INDEX "points_attendee_idx" ON "points_ledger" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "points_event_idx" ON "points_ledger" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "redemptions_attendee_idx" ON "redemptions" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "redemptions_reward_idx" ON "redemptions" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX "rewards_code_idx" ON "rewards" USING btree ("code");--> statement-breakpoint
CREATE INDEX "calinv_reg_idx" ON "calendar_invites" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "emailconf_reg_idx" ON "email_confirmations" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_event_attendee_uq" ON "registrations" USING btree ("event_id","attendee_id");--> statement-breakpoint
CREATE INDEX "registrations_event_idx" ON "registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "registrations_attendee_idx" ON "registrations" USING btree ("attendee_id");