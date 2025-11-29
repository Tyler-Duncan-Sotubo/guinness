// app/api/cron/sync-results/route.ts
import { NextResponse } from "next/server";
import { db } from "@/drizzle/drizzle";
import { matches } from "@/drizzle/schema/matches";
import { and, eq, lt, isNull } from "drizzle-orm";

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.API_FOOTBALL_KEY!;

export async function GET() {
  try {
    const now = new Date();

    console.log("sync-results: starting sync at", now.toISOString());

    // 1) Find matches that have kicked off but don't have final scores yet
    const pending = await db
      .select({
        id: matches.id,
        externalFixtureId: matches.externalFixtureId,
        kickoffAt: matches.kickoffAt,
      })
      .from(matches)
      .where(
        and(
          lt(matches.kickoffAt, now),
          isNull(matches.finalHomeScore),
          isNull(matches.finalAwayScore)
        )
      );

    if (!pending.length) {
      return NextResponse.json({ ok: true, updated: 0 });
    }

    console.log(`sync-results: found ${pending.length} pending matches`);

    let updatedCount = 0;

    // 2) For each pending match, fetch from football-data.org and update
    for (const m of pending) {
      if (!m.externalFixtureId) continue;

      const res = await fetch(`${API_BASE}/matches/${m.externalFixtureId}`, {
        headers: { "X-Auth-Token": API_KEY },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Failed to fetch match", m.externalFixtureId, res.status);
        continue;
      }

      const data = await res.json();

      const fullTime = data.score?.fullTime ?? {};
      const home = typeof fullTime.home === "number" ? fullTime.home : null;
      const away = typeof fullTime.away === "number" ? fullTime.away : null;

      // Only write if we actually got a result
      if (home === null || away === null) continue;

      await db
        .update(matches)
        .set({
          finalHomeScore: home,
          finalAwayScore: away,
        })
        .where(eq(matches.id, m.id));

      updatedCount++;
    }

    console.log(`sync-results: updated ${updatedCount} matches`);

    return NextResponse.json({ ok: true, updated: updatedCount });
  } catch (err) {
    console.error("sync-results error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
