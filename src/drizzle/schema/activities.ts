import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { attendees } from "./attendees";

export const activityTypes = pgTable(
  "activity_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(), // e.g. "spin", "quiz", "attendance"
    name: text("name").notNull(),
  },
  (t) => [index("activity_types_code_idx").on(t.code)]
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    attendeeId: uuid("attendee_id")
      .notNull()
      .references(() => attendees.id, { onDelete: "cascade" }),
    typeId: uuid("type_id")
      .notNull()
      .references(() => activityTypes.id, { onDelete: "restrict" }),
    payload: text("payload"), // can keep for extra data, but not main logic
    occurredAt: timestamp("occurred_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    index("activities_event_idx").on(t.eventId),
    index("activities_attendee_idx").on(t.attendeeId),
    index("activities_type_idx").on(t.typeId),
  ]
);

export const spinResults = pgTable(
  "spin_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    // what segment was hit
    segmentCode: text("segment_code").notNull(), // e.g. "no_win", "small_points", "big_prize"
    // outcome
    rewardId: uuid("reward_id").references(() => rewards.id, {
      onDelete: "set null",
    }),
    pointsAwarded: integer("points_awarded"), // null = no points for this spin
    isWin: integer("is_win").notNull().default(0), // or boolean() if you prefer
  },
  (t) => [
    index("spin_results_activity_idx").on(t.activityId),
    index("spin_results_reward_idx").on(t.rewardId),
  ]
);

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(), // "pint_voucher", "jersey", etc.
    name: text("name").notNull(),
    cost: integer("cost").notNull(), // for catalogue redemptions; 0 for free/instant prizes
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    // optionally for Spin & Win:
    probabilityWeight: integer("probability_weight").default(0), // higher = more likely
    maxQuantity: integer("max_quantity"), // null = unlimited
  },
  (t) => [
    index("rewards_code_idx").on(t.code),
    index("rewards_event_idx").on(t.eventId),
  ]
);

export const redemptions = pgTable(
  "redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // WHO redeemed?
    attendeeId: uuid("attendee_id")
      .notNull()
      .references(() => attendees.id, { onDelete: "cascade" }),

    // WHAT reward?
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id, { onDelete: "restrict" }),

    // WHY / HOW?
    // If redemption comes from a spin result:
    activityId: uuid("activity_id").references(() => activities.id, {
      onDelete: "set null",
    }),

    // For catalogue redemptions that cost points:
    pointsSpent: integer("points_spent"),

    // Optional – tie redemption to an event
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),

    // Fulfilment workflow
    status: text("status").notNull().default("pending"), // pending → claimed → collected → expired → cancelled

    claimedAt: timestamp("claimed_at", { mode: "date" }),
    fulfilledAt: timestamp("fulfilled_at", { mode: "date" }),
    redeemedAt: timestamp("redeemed_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    index("redemptions_attendee_idx").on(t.attendeeId),
    index("redemptions_reward_idx").on(t.rewardId),
    index("redemptions_event_idx").on(t.eventId),
    index("redemptions_activity_idx").on(t.activityId),
  ]
);
