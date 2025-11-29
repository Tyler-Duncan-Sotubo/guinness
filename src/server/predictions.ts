// src/server/predictions.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { db } from "@/drizzle/drizzle";
import { eq, and } from "drizzle-orm";
import { attendees } from "@/drizzle/schema/attendees";
import { registrations } from "@/drizzle/schema/registrations";
import { predictions } from "@/drizzle/schema/predictions";
import { eventGetById } from "@/server/events";
import { isMatchOpen } from "@/lib/match-time";
import { matches } from "@/drizzle/schema";

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

  // 2) Ensure match exists, belongs to this event, and is still open
  const [match] = await db
    .select({
      id: matches.id,
      eventId: matches.eventId,
      kickoffAt: matches.kickoffAt,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match) {
    return { ok: false as const, error: "Invalid matchId" as const };
  }

  if (match.eventId !== eventId) {
    return {
      ok: false as const,
      error: "Match does not belong to this event" as const,
    };
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

/**
 * Compute winners for an event based on all predictions and final scores.
 *
 * Scoring:
 * - 3 points = exact correct score
 * - 1 point = correct outcome (home win/draw/away win) but not exact
 * - 0 points = wrong outcome
 */
export async function predictionWinnersForEvent(eventId: string) {
  // --- helpers (same scoring as winners) ---
  const getOutcome = (home: number, away: number) => {
    if (home > away) return "HOME" as const;
    if (home < away) return "AWAY" as const;
    return "DRAW" as const;
  };

  const scorePrediction = (args: {
    predHome: number;
    predAway: number;
    finalHome: number | null;
    finalAway: number | null;
  }) => {
    const { predHome, predAway, finalHome, finalAway } = args;

    if (finalHome === null || finalAway === null) {
      return {
        isScored: false,
        isExact: false,
        isOutcomeCorrect: false,
        points: 0,
      };
    }

    const isExact = predHome === finalHome && predAway === finalAway;
    const predictedOutcome = getOutcome(predHome, predAway);
    const actualOutcome = getOutcome(finalHome, finalAway);
    const isOutcomeCorrect = predictedOutcome === actualOutcome;

    let points = 0;
    if (isExact) points = 3;
    else if (isOutcomeCorrect) points = 1;

    return {
      isScored: true,
      isExact,
      isOutcomeCorrect,
      points,
    };
  };

  try {
    // All predictions for this event, with attendee + match info
    const rows = await db
      .select({
        attendeeEmail: attendees.email,

        matchId: matches.id,
        homeTeam: matches.homeTeam,
        awayTeam: matches.awayTeam,
        kickoffAt: matches.kickoffAt,

        finalHome: matches.finalHomeScore,
        finalAway: matches.finalAwayScore,

        predHome: predictions.homeScore,
        predAway: predictions.awayScore,
      })
      .from(predictions)
      .innerJoin(
        registrations,
        eq(registrations.id, predictions.registrationId)
      )
      .innerJoin(attendees, eq(attendees.id, registrations.attendeeId))
      .innerJoin(
        matches,
        and(eq(matches.id, predictions.matchId), eq(matches.eventId, eventId))
      )
      .where(eq(predictions.eventId, eventId));

    if (!rows.length) {
      return {
        ok: true as const,
        items: [] as Array<unknown>,
      };
    }

    const items = rows.map((row) => {
      const {
        attendeeEmail,
        matchId,
        homeTeam,
        awayTeam,
        kickoffAt,
        finalHome,
        finalAway,
        predHome,
        predAway,
      } = row;

      const scoring = scorePrediction({
        predHome,
        predAway,
        finalHome,
        finalAway,
      });

      const predictedOutcome = getOutcome(predHome, predAway);
      const actualOutcome =
        finalHome === null || finalAway === null
          ? null
          : getOutcome(finalHome, finalAway);

      const humanOutcomeText = {
        HOME: "Home team won",
        AWAY: "Away team won",
        DRAW: "It was a draw",
      } as const;

      let result = "Not scored — match not finished";

      if (scoring.isScored) {
        if (scoring.isExact) {
          result = "Exact — predicted the exact scoreline";
        } else if (scoring.isOutcomeCorrect && actualOutcome) {
          result = `Correct outcome — ${humanOutcomeText[actualOutcome]}`;
        } else {
          result = "Wrong — predicted wrong winner";
        }
      }

      return {
        // CSV-friendly, human-readable fields
        attendeeEmail,
        matchId,
        match: `${homeTeam} vs ${awayTeam}`,
        kickoffAt:
          kickoffAt instanceof Date
            ? kickoffAt.toISOString()
            : String(kickoffAt),

        predictedScore: `${predHome}-${predAway}`,
        finalScore:
          finalHome === null || finalAway === null
            ? ""
            : `${finalHome}-${finalAway}`,

        predictedOutcome, // "HOME" | "AWAY" | "DRAW"
        actualOutcome: actualOutcome ?? "",

        result, // Explicit: e.g. "Correct outcome — Home team won"
        points: scoring.points, // 3 / 1 / 0
      };
    });

    return {
      ok: true as const,
      items,
    };
  } catch (e: any) {
    console.error("predictionSummaryForEvent error:", e);
    return { ok: false as const, error: "Server error" as const };
  }
}

export async function predictionLeaderboardSummaryForEvent(eventId: string) {
  // --- helpers (same scoring rules as before) ---
  const getOutcome = (home: number, away: number) => {
    if (home > away) return "HOME" as const;
    if (home < away) return "AWAY" as const;
    return "DRAW" as const;
  };

  const scorePrediction = (args: {
    predHome: number;
    predAway: number;
    finalHome: number | null;
    finalAway: number | null;
  }) => {
    const { predHome, predAway, finalHome, finalAway } = args;

    if (finalHome === null || finalAway === null) {
      return {
        isScored: false,
        isExact: false,
        isOutcomeCorrect: false,
        points: 0,
      };
    }

    const isExact = predHome === finalHome && predAway === finalAway;
    const predictedOutcome = getOutcome(predHome, predAway);
    const actualOutcome = getOutcome(finalHome, finalAway);
    const isOutcomeCorrect = predictedOutcome === actualOutcome;

    let points = 0;
    if (isExact) points = 3;
    else if (isOutcomeCorrect) points = 1;

    return {
      isScored: true,
      isExact,
      isOutcomeCorrect,
      points,
      predictedOutcome,
      actualOutcome,
    };
  };

  try {
    // Get ALL predictions for this event with attendee + match info
    const rows = await db
      .select({
        attendeeEmail: attendees.email,
        homeTeam: matches.homeTeam,
        awayTeam: matches.awayTeam,
        kickoffAt: matches.kickoffAt,
        finalHome: matches.finalHomeScore,
        finalAway: matches.finalAwayScore,
        predHome: predictions.homeScore,
        predAway: predictions.awayScore,
      })
      .from(predictions)
      .innerJoin(
        registrations,
        eq(registrations.id, predictions.registrationId)
      )
      .innerJoin(attendees, eq(attendees.id, registrations.attendeeId))
      .innerJoin(
        matches,
        and(eq(matches.id, predictions.matchId), eq(matches.eventId, eventId))
      )
      .where(eq(predictions.eventId, eventId));

    if (!rows.length) {
      return {
        ok: true as const,
        items: [] as Array<unknown>,
      };
    }

    type Aggregated = {
      attendeeEmail: string;
      totalPredictions: number;
      exactCount: number;
      correctOutcomeCount: number;
      wrongCount: number;
      notScoredCount: number;
      totalPoints: number;
      breakdownParts: string[];
    };

    const humanOutcomeText = {
      HOME: "Home team won",
      AWAY: "Away team won",
      DRAW: "It was a draw",
    } as const;

    const byEmail = new Map<string, Aggregated>();

    for (const row of rows) {
      const {
        attendeeEmail,
        homeTeam,
        awayTeam,
        kickoffAt,
        finalHome,
        finalAway,
        predHome,
        predAway,
      } = row;

      const scoring = scorePrediction({
        predHome,
        predAway,
        finalHome,
        finalAway,
      });

      let agg = byEmail.get(attendeeEmail);
      if (!agg) {
        agg = {
          attendeeEmail,
          totalPredictions: 0,
          exactCount: 0,
          correctOutcomeCount: 0,
          wrongCount: 0,
          notScoredCount: 0,
          totalPoints: 0,
          breakdownParts: [],
        };
        byEmail.set(attendeeEmail, agg);
      }

      agg.totalPredictions += 1;

      const kickoffStr =
        kickoffAt instanceof Date ? kickoffAt.toISOString() : String(kickoffAt);

      const baseMatchLabel = `${homeTeam} vs ${awayTeam} (${kickoffStr})`;

      let resultLabel = "Not scored — match not finished";
      let outcomeDetail = "";

      if (!scoring.isScored) {
        agg.notScoredCount += 1;
      } else {
        agg.totalPoints += scoring.points;

        if (scoring.isExact) {
          agg.exactCount += 1;
          outcomeDetail =
            humanOutcomeText[
              scoring.actualOutcome as keyof typeof humanOutcomeText
            ];
          resultLabel = `Exact — predicted the exact scoreline (${outcomeDetail})`;
        } else if (scoring.isOutcomeCorrect) {
          agg.correctOutcomeCount += 1;
          outcomeDetail =
            humanOutcomeText[
              scoring.actualOutcome as keyof typeof humanOutcomeText
            ];
          resultLabel = `Correct outcome — ${outcomeDetail}`;
        } else {
          agg.wrongCount += 1;
          // we still know the actual outcome:
          outcomeDetail = scoring.actualOutcome
            ? humanOutcomeText[scoring.actualOutcome]
            : "";
          resultLabel = "Wrong — predicted wrong winner";
        }
      }

      const finalScoreStr =
        finalHome === null || finalAway === null
          ? "match not finished"
          : `${finalHome}-${finalAway}`;

      const breakdownLine =
        `${baseMatchLabel}: ` +
        `predicted ${predHome}-${predAway}, final ${finalScoreStr} ` +
        `→ ${resultLabel} [${scoring.points} pt${
          scoring.points === 1 ? "" : "s"
        }]`;

      agg.breakdownParts.push(breakdownLine);
    }

    // One row per email; breakdown is a single string with all matches
    const items = Array.from(byEmail.values()).map((agg) => ({
      attendeeEmail: agg.attendeeEmail,
      totalPredictions: agg.totalPredictions,
      exactCount: agg.exactCount,
      correctOutcomeCount: agg.correctOutcomeCount,
      wrongCount: agg.wrongCount,
      notScoredCount: agg.notScoredCount,
      // Use " | " separator inside the cell; CSV exporter will quote the field
      breakdown: agg.breakdownParts.join(" | "),
      totalPoints: agg.totalPoints, // 👈 still last column
    }));

    return {
      ok: true as const,
      items,
    };
  } catch (e: any) {
    console.error("predictionLeaderboardSummaryForEvent error:", e);
    return { ok: false as const, error: "Server error" as const };
  }
}
