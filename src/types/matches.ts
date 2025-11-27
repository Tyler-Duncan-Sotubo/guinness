export type MatchItem = {
  id: string;
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  externalFixtureId: string;
  city: string | null;
  venue: string | null;
  finalHomeScore?: number | null;
  finalAwayScore?: number | null;
};
