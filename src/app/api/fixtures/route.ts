/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/fixtures/by-round/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.API_FOOTBALL_KEY!;

// Clean team names ("Liverpool FC" → "Liverpool")
function cleanTeamName(name: string): string {
  return name
    .replace(/\bFC\b/gi, "")
    .replace(/\bAFC\b/gi, "")
    .replace(/\bCF\b/gi, "")
    .replace(/\bSC\b/gi, "")
    .replace(/\bUnited FC\b/gi, "United")
    .replace(/\bCity FC\b/gi, "City")
    .replace(/\bTown FC\b/gi, "Town")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get("league");
  const season = searchParams.get("season");
  const round = searchParams.get("round");

  if (!league || !season || !round) {
    return NextResponse.json(
      { error: "league, season and round are required" },
      { status: 400 }
    );
  }

  const qs = new URLSearchParams({
    season,
    matchday: round,
  });

  const res = await fetch(
    `${API_BASE}/competitions/${league}/matches?${qs.toString()}`,
    {
      headers: { "X-Auth-Token": API_KEY },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch fixtures from football-data.org" },
      { status: 502 }
    );
  }

  const data = await res.json();
  const items =
    (data.matches ?? []).map((m: any) => ({
      fixtureId: m.id,
      date: m.utcDate,
      homeTeam: cleanTeamName(m.homeTeam?.name ?? ""),
      awayTeam: cleanTeamName(m.awayTeam?.name ?? ""),
    })) ?? [];

  return NextResponse.json({ items });
}
