import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { attendees } from "./attendees";

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    attendeeId: uuid("attendee_id")
      .notNull()
      .references(() => attendees.id, { onDelete: "cascade" }),
    // capture online vs walk-in path
    source: text("source")
      .$type<"online" | "walkin">()
      .notNull()
      .default("online"), // :contentReference[oaicite:10]{index=10}
    // consent snapshots at registration time
    acceptedTerms: boolean("accepted_terms").notNull().default(false),
    acceptedMarketing: boolean("accepted_marketing").notNull().default(false),
    status: text("status")
      .$type<"pending" | "confirmed" | "cancelled" | "attended">()
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    uniqueIndex("registrations_event_attendee_uq").on(t.eventId, t.attendeeId),
    index("registrations_event_idx").on(t.eventId),
    index("registrations_attendee_idx").on(t.attendeeId),
  ]
);
