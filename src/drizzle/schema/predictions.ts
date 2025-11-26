// drizzle/schema/predictions.ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Link back to the registration (attendee + event)
    registrationId: uuid("registration_id").notNull(),

    // Store eventId as well for easy filtering (denormalised but handy)
    eventId: uuid("event_id").notNull(),

    // From your DEMO_MATCHES array, e.g. "cp-mun-12"
    matchId: text("match_id").notNull(),

    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    // One prediction per registration per match
    uniqueIndex("predictions_registration_match_uq").on(
      t.registrationId,
      t.matchId
    ),
    index("predictions_event_match_idx").on(t.eventId, t.matchId),
  ]
);

export type Prediction = typeof predictions.$inferSelect;
export type PredictionInsert = typeof predictions.$inferInsert;
