import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { events } from "./events";
import { activities } from "./activities";
import { attendees } from "./attendees";

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    // "single_choice", "multi_choice", "open" etc
    type: text("type").notNull().default("single_choice"),
  },
  (t) => [index("quiz_questions_event_idx").on(t.eventId)]
);

export const quizOptions = pgTable(
  "quiz_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    isCorrect: integer("is_correct").notNull().default(0), // or boolean()
    order: integer("order").notNull().default(0),
  },
  (t) => [index("quiz_options_question_idx").on(t.questionId)]
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    attendeeId: uuid("attendee_id")
      .notNull()
      .references(() => attendees.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    maxScore: integer("max_score").notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }).defaultNow(),
  },
  (t) => [
    index("quiz_attempts_event_idx").on(t.eventId),
    index("quiz_attempts_attendee_idx").on(t.attendeeId),
  ]
);

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => quizQuestions.id, { onDelete: "cascade" }),
    optionId: uuid("option_id").references(() => quizOptions.id, {
      onDelete: "set null",
    }),
    isCorrect: integer("is_correct").notNull().default(0),
  },
  (t) => [
    index("quiz_answers_attempt_idx").on(t.attemptId),
    index("quiz_answers_question_idx").on(t.questionId),
  ]
);
