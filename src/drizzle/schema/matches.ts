import {
  pgTable,
  text,
  uuid,
  timestamp,
  index,
  integer,
} from "drizzle-orm/pg-core";

export const matches = pgTable(
  "matches",
  {
    // Match ID from your DEMO_MATCHES array, e.g. "cp-mun-12"
    id: uuid("id").primaryKey().defaultRandom(),

    // Event this match belongs to
    eventId: uuid("event_id").notNull(),

    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),

    // When the match kicks off (used by isMatchOpen on the backend too, if you like)
    kickoffAt: timestamp("kickoff_at", { mode: "date" }).notNull(),
    externalFixtureId: text("external_fixture_id").notNull(),

    // ✅ NEW: final result coming from cron job / API
    finalHomeScore: integer("final_home_score"),
    finalAwayScore: integer("final_away_score"),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    index("matches_event_idx").on(t.eventId),
    index("matches_external_fixture_idx").on(t.externalFixtureId),
  ]
);

export type Match = typeof matches.$inferSelect;
export type MatchInsert = typeof matches.$inferInsert;
