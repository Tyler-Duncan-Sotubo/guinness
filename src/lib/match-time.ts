export function isMatchOpen(kickoffAt: string | Date, now: Date = new Date()) {
  const kickoff = kickoffAt instanceof Date ? kickoffAt : new Date(kickoffAt);

  if (Number.isNaN(kickoff.getTime())) return false;

  return now < kickoff; // still only allow BEFORE kickoff
}
