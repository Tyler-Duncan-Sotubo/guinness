/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/drizzle/drizzle";
import { and, eq } from "drizzle-orm";
import { matches } from "@/drizzle/schema";
import { attendees } from "@/drizzle/schema/attendees";
import { registrations } from "@/drizzle/schema/registrations";
import { predictions } from "@/drizzle/schema/predictions";

import { exportToCSVBuffer, exportToExcelBuffer } from "@/lib/export-util";
import { uploadBufferToS3, guessMimeType } from "@/lib/s3-storage";

type Ctx = { params: Promise<{ id: string }> };

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

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { format = "csv", city } = await req.json().catch(() => ({}));

  // 1) Get all matches for the event (to build dynamic columns)
  const matchRows = await db
    .select({
      id: matches.id,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      finalHome: matches.finalHomeScore,
      finalAway: matches.finalAwayScore,
    })
    .from(matches)
    .where(eq(matches.eventId, id));

  if (!matchRows.length) {
    return new Response("No matches for this event", { status: 404 });
  }

  // Each match -> 1 field/column
  const matchMap = new Map<
    string,
    {
      label: string;
      finalHome: number | null;
      finalAway: number | null;
      field: string;
    }
  >();

  matchRows.forEach((m, index) => {
    const label = `${m.homeTeam} vs ${m.awayTeam}`;
    const field = `match_${index + 1}`;
    matchMap.set(m.id, {
      label,
      finalHome: m.finalHome,
      finalAway: m.finalAway,
      field,
    });
  });

  // 2) Get all predictions for this event (joined with attendees + matches)
  const predictionRows = await db
    .select({
      attendeeEmail: attendees.email,
      attendeeName: attendees.name, // assumes `name` column on attendees
      matchId: predictions.matchId,
      predHome: predictions.homeScore,
      predAway: predictions.awayScore,
    })
    .from(predictions)
    .innerJoin(registrations, eq(registrations.id, predictions.registrationId))
    .innerJoin(attendees, eq(attendees.id, registrations.attendeeId))
    .innerJoin(
      matches,
      and(eq(matches.id, predictions.matchId), eq(matches.eventId, id))
    )
    .where(eq(predictions.eventId, id));

  if (!predictionRows.length) {
    return new Response("No predictions for this event", { status: 404 });
  }

  type RowAgg = {
    attendeeEmail: string;
    attendeeName: string;
    totalPoints: number;
    totalPredictions: number;
    percentage: number;
    [key: string]: string | number;
  };

  const byEmail = new Map<string, RowAgg>();

  for (const row of predictionRows) {
    const { attendeeEmail, attendeeName, matchId, predHome, predAway } = row;
    const matchInfo = matchMap.get(matchId);
    if (!matchInfo) continue;

    let agg = byEmail.get(attendeeEmail);
    if (!agg) {
      agg = {
        attendeeEmail,
        attendeeName: attendeeName ?? "",
        totalPoints: 0,
        totalPredictions: 0,
        percentage: 0,
      };

      // init all match fields as empty strings
      for (const info of matchMap.values()) {
        agg[info.field] = "";
      }

      byEmail.set(attendeeEmail, agg);
    }

    agg.totalPredictions += 1;

    const predStr = `${predHome}-${predAway}`;

    const finalStr =
      matchInfo.finalHome === null || matchInfo.finalAway === null
        ? ""
        : `${matchInfo.finalHome}-${matchInfo.finalAway}`;

    // Single cell per match: "3-0 (prediction) / 2-1 (final)"
    let combined = "";
    if (finalStr) {
      combined = `${predStr} (prediction) / ${finalStr} (final)`;
    } else {
      combined = `${predStr} (prediction)`;
    }

    agg[matchInfo.field] = combined;

    const scored = scorePrediction({
      predHome,
      predAway,
      finalHome: matchInfo.finalHome,
      finalAway: matchInfo.finalAway,
    });

    if (scored.isScored) {
      agg.totalPoints += scored.points;
    }
  }

  let items = Array.from(byEmail.values());
  if (!items.length) {
    return new Response("No predictions for this event", { status: 404 });
  }

  // 3) Compute percentage for each player
  for (const item of items) {
    const maxPossiblePoints = item.totalPredictions * 3; // 3 pts per prediction max
    item.percentage = maxPossiblePoints
      ? Number(((item.totalPoints / maxPossiblePoints) * 100).toFixed(2))
      : 0;
  }

  // 4) Sort: highest percentage first, then highest totalPoints
  items = items.sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return b.totalPoints - a.totalPoints;
  });

  // 5) Columns: Name, Email, each match, Accuracy, Total Points
  const matchColumns = Array.from(matchMap.values()).map((info) => ({
    field: info.field,
    title: info.label, // e.g. "Chelsea vs Arsenal"
  }));

  const columns = [
    { field: "attendeeName", title: "Name" },
    { field: "attendeeEmail", title: "Email" },
    ...matchColumns,
    { field: "percentage", title: "Accuracy (%)" },
    { field: "totalPoints", title: "Total Points" }, // last column
  ];

  // 6) Normalize rows for export
  const rows = items.map((r) => {
    const base: any = {
      attendeeName: r.attendeeName,
      attendeeEmail: r.attendeeEmail,
      percentage: Number(r.percentage ?? 0),
      totalPoints: Number(r.totalPoints ?? 0),
    };

    for (const info of matchMap.values()) {
      base[info.field] = String(r[info.field] ?? "");
    }

    return base;
  });

  const ext = format === "excel" || format === "xlsx" ? "xlsx" : "csv";

  const safeEventId = id.replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `predictions_${city}.${ext}`;
  const key = `exports/events/${safeEventId}/${filename}`;

  const buffer =
    ext === "xlsx"
      ? await exportToExcelBuffer(rows, columns, "Predictions")
      : exportToCSVBuffer(rows, columns);

  const mimeType = guessMimeType(filename);
  const { url } = await uploadBufferToS3(buffer, key, mimeType);

  return Response.json({ ok: true, url, key });
}
