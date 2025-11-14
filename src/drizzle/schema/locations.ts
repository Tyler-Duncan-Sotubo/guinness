import { pgTable, uuid, text, index, uniqueIndex } from "drizzle-orm/pg-core";

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    city: text("city").notNull(),
    venue: text("venue"),
  },
  (t) => [
    index("locations_city_idx").on(t.city),
    index("locations_venue_idx").on(t.venue),
    uniqueIndex("locations_city_venue_uq").on(t.city, t.venue),
  ]
);
