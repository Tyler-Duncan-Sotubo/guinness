import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { registrations } from "./registrations";

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    type: text("type").$type<"age_gate" | "terms" | "marketing">().notNull(),
    value: text("value").$type<"accepted" | "rejected">().notNull(),
    capturedAt: timestamp("captured_at", { mode: "date" }).defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("consents_registration_idx").on(t.registrationId),
    index("consents_type_idx").on(t.type),
  ]
);
