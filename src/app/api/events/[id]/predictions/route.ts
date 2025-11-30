/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/drizzle/drizzle";
import { and, eq, inArray } from "drizzle-orm";
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

  return { isScored: true, isExact, isOutcomeCorrect, points };
};

// Only consider these two matches
const INCLUDED_MATCH_IDS = [
  "893b0f79-063d-43f3-a236-0aecca606e8b",
  "d32c0de4-e350-478d-bea4-693fd834d764",
];

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const { format = "csv", city } = await req.json().catch(() => ({}));

  // 1) Get ONLY the included matches
  const matchRows = await db
    .select({
      id: matches.id,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      finalHome: matches.finalHomeScore,
      finalAway: matches.finalAwayScore,
    })
    .from(matches)
    .where(
      and(eq(matches.eventId, id), inArray(matches.id, INCLUDED_MATCH_IDS))
    );

  if (!matchRows.length)
    return new Response("No included matches", { status: 404 });

  const matchMap = new Map();
  matchRows.forEach((m, index) => {
    matchMap.set(m.id, {
      label: `${m.homeTeam} vs ${m.awayTeam}`,
      finalHome: m.finalHome,
      finalAway: m.finalAway,
      field: `match_${index + 1}`,
    });
  });

  // 2) Get predictions including createdAt
  const predictionRows = await db
    .select({
      attendeeEmail: attendees.email,
      attendeeName: attendees.name,
      matchId: predictions.matchId,
      predHome: predictions.homeScore,
      predAway: predictions.awayScore,
      createdAt: predictions.createdAt, // ✅ NEW
    })
    .from(predictions)
    .innerJoin(registrations, eq(registrations.id, predictions.registrationId))
    .innerJoin(attendees, eq(attendees.id, registrations.attendeeId))
    .innerJoin(
      matches,
      and(eq(matches.id, predictions.matchId), eq(matches.eventId, id))
    )
    .where(
      and(
        eq(predictions.eventId, id),
        inArray(predictions.matchId, INCLUDED_MATCH_IDS)
      )
    );

  if (!predictionRows.length)
    return new Response("No predictions for included matches", { status: 404 });

  type RowAgg = {
    attendeeEmail: string;
    attendeeName: string;
    totalPoints: number;
    totalPredictions: number;
    percentage: number;
    firstTimestamp: Date | null; // ✅ NEW
    [key: string]: string | number | Date | null;
  };

  const byEmail = new Map<string, RowAgg>();

  for (const row of predictionRows) {
    const {
      attendeeEmail,
      attendeeName,
      matchId,
      predHome,
      predAway,
      createdAt,
    } = row;
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
        firstTimestamp: createdAt, // first prediction time
      };

      for (const info of matchMap.values()) agg[info.field] = "";
      byEmail.set(attendeeEmail, agg);
    } else {
      // earlier timestamp wins
      if (
        !agg.firstTimestamp ||
        (createdAt && createdAt < agg.firstTimestamp)
      ) {
        agg.firstTimestamp = createdAt;
      }
    }

    agg.totalPredictions += 1;

    const predStr = `${predHome}-${predAway}`;
    const finalStr =
      matchInfo.finalHome != null && matchInfo.finalAway != null
        ? `${matchInfo.finalHome}-${matchInfo.finalAway}`
        : "";

    agg[matchInfo.field] = finalStr
      ? `${predStr} (prediction) / ${finalStr} (final)`
      : `${predStr} (prediction)`;

    const scored = scorePrediction({
      predHome,
      predAway,
      finalHome: matchInfo.finalHome,
      finalAway: matchInfo.finalAway,
    });

    if (scored.isScored) agg.totalPoints += scored.points;
  }

  let items = Array.from(byEmail.values());
  if (!items.length)
    return new Response("No predictions found", { status: 404 });

  // 3) Calculate accuracy
  for (const item of items) {
    const maxPoints = item.totalPredictions * 3;
    item.percentage = maxPoints
      ? Number(((item.totalPoints / maxPoints) * 100).toFixed(2))
      : 0;
  }

  // 4) Sort with FAST-FINGERS:
  //    1. Higher accuracy
  //    2. Higher total points
  //    3. Earlier createdAt wins
  items = items.sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return (
      (a.firstTimestamp?.getTime() ?? 0) - (b.firstTimestamp?.getTime() ?? 0)
    );
  });

  // 5) Build export file
  const matchColumns = Array.from(matchMap.values()).map((info) => ({
    field: info.field,
    title: info.label,
  }));

  const columns = [
    { field: "attendeeName", title: "Name" },
    { field: "attendeeEmail", title: "Email" },
    ...matchColumns,
    { field: "percentage", title: "Accuracy (%)" },
    { field: "totalPoints", title: "Total Points" },
    { field: "firstTimestamp", title: "Submitted At" }, // optional column
  ];

  const rows = items.map((r) => {
    const base: any = {
      attendeeName: r.attendeeName,
      attendeeEmail: r.attendeeEmail,
      percentage: r.percentage,
      totalPoints: r.totalPoints,
      firstTimestamp: r.firstTimestamp?.toISOString() ?? "",
    };

    for (const info of matchMap.values())
      base[info.field] = String(r[info.field] ?? "");
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

  // 7) Winners payload for UI (with timestamp)
  const winners = items.map((item, index) => ({
    rank: index + 1,
    name: item.attendeeName,
    email: item.attendeeEmail,
    totalPoints: item.totalPoints,
    percentage: item.percentage,
    submittedAt: item.firstTimestamp?.toISOString() ?? "",
  }));

  return Response.json({ ok: true, url, key, winners });
}
