CREATE TYPE "public"."user_role" AS ENUM('user', 'staff', 'admin');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
CREATE INDEX "users_role_index" ON "users" USING btree ("role");