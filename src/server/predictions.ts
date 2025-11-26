// src/server/predictions.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { db } from "@/drizzle/drizzle";
import { eq, and } from "drizzle-orm";

import { attendees } from "@/drizzle/schema/attendees";
import { registrations } from "@/drizzle/schema/registrations";
import { predictions } from "@/drizzle/schema/predictions";
import { eventGetById } from "@/server/events";
import { DEMO_MATCHES } from "@/lib/demo-matches";
import { isMatchOpen } from "@/lib/match-time";

type CreatePredictionInput = {
  email: string;
  eventId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export async function predictionCreateOrUpdateForEmail(
  input: CreatePredictionInput
) {
  const { email, eventId, matchId, homeScore, awayScore } = input;

  // 1) Ensure event exists
  const eventResult = await eventGetById(eventId);
  if (!eventResult.ok) {
    return { ok: false as const, error: "Invalid eventId" as const };
  }

  const event = eventResult.item;

  // 2) Ensure matchId is valid AND still open (server-side check)
  const match = DEMO_MATCHES.find((m) => m.id === matchId);
  if (!match) {
    return { ok: false as const, error: "Invalid matchId" as const };
  }

  if (!isMatchOpen(match.kickoffAt)) {
    return {
      ok: false as const,
      error: "Predictions closed for this match" as const,
    };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 3) Find attendee by email
      const [attendee] = await tx
        .select()
        .from(attendees)
        .where(eq(attendees.email, email))
        .limit(1);

      if (!attendee) {
        return {
          ok: false as const,
          error: "Attendee not found for this email" as const,
        };
      }

      // 4) Find registration for this attendee + event
      const [registration] = await tx
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.attendeeId, attendee.id),
            eq(registrations.eventId, eventId)
          )
        )
        .limit(1);

      if (!registration) {
        return {
          ok: false as const,
          error: "No registration found for this event" as const,
        };
      }

      // 5) Check for existing prediction for this registration + match
      const [existingPrediction] = await tx
        .select()
        .from(predictions)
        .where(
          and(
            eq(predictions.registrationId, registration.id),
            eq(predictions.matchId, matchId)
          )
        )
        .limit(1);

      let prediction = existingPrediction;
      let isNew = false;

      if (!existingPrediction) {
        // Create new prediction
        const [created] = await tx
          .insert(predictions)
          .values({
            registrationId: registration.id,
            eventId,
            matchId,
            homeScore,
            awayScore,
          })
          .returning();
        prediction = created;
        isNew = true;
      } else {
        // Update existing prediction (overwrite scores)
        const [updated] = await tx
          .update(predictions)
          .set({
            homeScore,
            awayScore,
          })
          .where(eq(predictions.id, existingPrediction.id))
          .returning();
        prediction = updated;
        isNew = false;
      }

      if (!prediction) {
        return {
          ok: false as const,
          error: "Failed to save prediction" as const,
        };
      }

      return {
        ok: true as const,
        item: {
          isNew,
          event,
          attendee,
          registration,
          prediction,
        },
      };
    });

    return result;
  } catch (e: any) {
    console.error("predictionCreateOrUpdateForEmail error:", e);
    return { ok: false as const, error: "Server error" as const };
  }
}

// Optional helper to read an existing prediction:
export async function predictionListForEmailAndEvent(input: {
  email: string;
  eventId: string;
}) {
  const { email, eventId } = input;

  try {
    // Single joined query: attendee -> registration -> predictions
    const rows = await db
      .select({
        matchId: predictions.matchId,
        homeScore: predictions.homeScore,
        awayScore: predictions.awayScore,
      })
      .from(attendees)
      .innerJoin(
        registrations,
        and(
          eq(registrations.attendeeId, attendees.id),
          eq(registrations.eventId, eventId)
        )
      )
      .innerJoin(predictions, eq(predictions.registrationId, registrations.id))
      .where(eq(attendees.email, email));

    // If nothing, return empty array (easier for UI than 404)
    if (!rows.length) {
      return {
        ok: true as const,
        items: [] as typeof rows,
      };
    }

    return {
      ok: true as const,
      items: rows,
    };
  } catch (e: any) {
    console.error("predictionListForEmailAndEvent error:", e);
    return { ok: false as const, error: "Server error" as const };
  }
}
