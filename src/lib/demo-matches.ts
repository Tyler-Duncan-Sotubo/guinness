// lib/demo-matches.ts

export type DemoMatch = {
  id: string;
  dateLabel: string; // "30 NOV"
  kickoffLabel: string; // "12:00", "14:05", etc
  kickoffAt: string; // ISO datetime for logic
  homeTeam: string;
  awayTeam: string;
};

export const DEMO_MATCHES: DemoMatch[] = [
  {
    id: "cp-mun-12",
    dateLabel: "30 NOV",
    kickoffLabel: "12:00",
    kickoffAt: "2025-11-30T12:00:00+01:00", // adjust to your TZ
    homeTeam: "Crystal Palace",
    awayTeam: "Manchester United",
  },
  {
    id: "whu-liv-1405",
    dateLabel: "30 NOV",
    kickoffLabel: "14:05",
    kickoffAt: "2025-11-30T14:05:00+01:00",
    homeTeam: "West Ham United",
    awayTeam: "Liverpool",
  },
  {
    id: "che-ars-1630",
    dateLabel: "30 NOV",
    kickoffLabel: "16:30",
    kickoffAt: "2025-11-30T16:30:00+01:00",
    homeTeam: "Chelsea",
    awayTeam: "Arsenal",
  },
];
