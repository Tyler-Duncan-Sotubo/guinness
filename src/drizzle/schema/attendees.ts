import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => [index("attendees_email_idx").on(t.email)]
);
