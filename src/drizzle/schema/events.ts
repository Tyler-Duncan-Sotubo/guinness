import {
  pgTable,
  uuid,
  text,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { locations } from "./locations";

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    title: text("title").notNull(), // e.g. "Guinness Match Day - Owerri"
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    isEpic: boolean("is_epic").notNull().default(true), // Epic (register) vs Regular (walk-in) :contentReference[oaicite:9]{index=9}
    status: text("status")
      .$type<"draft" | "published" | "archived">()
      .notNull()
      .default("published"),
  },
  (t) => [
    index("events_location_idx").on(t.locationId),
    index("events_starts_idx").on(t.startsAt),
    uniqueIndex("events_location_start_uq").on(t.locationId, t.startsAt),
  ]
);
