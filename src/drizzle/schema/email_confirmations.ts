import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { registrations } from "./registrations";

export const emailConfirmations = pgTable(
  "email_confirmations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    status: text("status")
      .$type<"sent" | "delivered" | "opened" | "confirmed" | "bounced">()
      .notNull()
      .default("sent"),
    sentAt: timestamp("sent_at", { mode: "date" }),
    confirmedAt: timestamp("confirmed_at", { mode: "date" }),
  },
  (t) => [index("emailconf_reg_idx").on(t.registrationId)]
);

export const calendarInvites = pgTable(
  "calendar_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    icsUrl: text("ics_url"),
    sentAt: timestamp("sent_at", { mode: "date" }),
    status: text("status")
      .$type<"queued" | "sent" | "failed">()
      .default("queued"),
  },
  (t) => [index("calinv_reg_idx").on(t.registrationId)]
);
