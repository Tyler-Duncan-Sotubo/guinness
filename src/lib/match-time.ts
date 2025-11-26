// lib/match-time.ts

export function isMatchOpen(kickoffAtISO: string, now: Date = new Date()) {
  const kickoff = new Date(kickoffAtISO);
  if (Number.isNaN(kickoff.getTime())) return false;
  return now < kickoff; // only allow BEFORE kickoff
}
