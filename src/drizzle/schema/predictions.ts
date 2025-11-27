import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { matches } from "./matches";

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    registrationId: uuid("registration_id").notNull(),

    eventId: uuid("event_id").notNull(),

    // From your DEMO_MATCHES array, e.g. "cp-mun-12"
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),

    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    uniqueIndex("predictions_registration_match_uq").on(
      t.registrationId,
      t.matchId
    ),
    index("predictions_event_match_idx").on(t.eventId, t.matchId),
  ]
);

export type Prediction = typeof predictions.$inferSelect;
export type PredictionInsert = typeof predictions.$inferInsert;
