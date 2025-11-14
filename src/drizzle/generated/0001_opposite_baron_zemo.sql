CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"venue" text
);
--> statement-breakpoint
CREATE INDEX "locations_city_idx" ON "locations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "locations_venue_idx" ON "locations" USING btree ("venue");--> statement-breakpoint
CREATE UNIQUE INDEX "locations_city_venue_uq" ON "locations" USING btree ("city","venue");