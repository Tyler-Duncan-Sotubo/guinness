import {
  pgTable,
  uuid,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { events } from "./events";

export const userEventSpins = pgTable(
  "user_event_spins",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    // Total spins this user has taken for this event
    totalSpins: integer("total_spins").notNull().default(0),

    // Optional: daily limiting if you want it
    spinsToday: integer("spins_today").notNull().default(0),
    spinsTodayDate: timestamp("spins_today_date", { mode: "date" }),

    lastSpinAt: timestamp("last_spin_at", { mode: "date" }),
  },
  (t) => [
    uniqueIndex("user_event_spins_user_event_key").on(t.userId, t.eventId),
    index("user_event_spins_user_idx").on(t.userId),
    index("user_event_spins_event_idx").on(t.eventId),
  ]
);
