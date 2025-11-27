/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { db } from "@/drizzle/drizzle";
import { eq, asc } from "drizzle-orm";
import { matches } from "@/drizzle/schema/matches";
import { events } from "@/drizzle/schema/events";
import { CreateMatchInput, UpdateMatchInput } from "@/schema/matches";
import { locations } from "@/drizzle/schema";

// List matches, optionally filtered by eventId
export async function matchList(eventId?: string) {
  const query = db
    .select({
      id: matches.id,
      eventId: matches.eventId,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      kickoffAt: matches.kickoffAt,
      externalFixtureId: matches.externalFixtureId,
      finalHomeScore: matches.finalHomeScore,
      finalAwayScore: matches.finalAwayScore,
    })
    .from(matches)
    .orderBy(asc(matches.kickoffAt), asc(matches.id));

  if (eventId) {
    query.where(eq(matches.eventId, eventId));
  }

  return query;
}

// Get a single match by its id
export async function matchGetById(id: string) {
  const [item] = await db.select().from(matches).where(eq(matches.id, id));
  if (!item) return { ok: false as const, error: "Not found" };
  return { ok: true as const, item };
}

// Create a match (ensures eventId is valid)
export async function matchCreate(input: CreateMatchInput) {
  // Validate eventId exists
  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, input.eventId))
    .limit(1);

  if (!ev) return { ok: false as const, error: "Invalid eventId" };

  try {
    const [item] = await db.insert(matches).values(input).returning();
    return { ok: true as const, item };
  } catch (e: any) {
    if (e?.code === "23505") {
      return {
        ok: false as const,
        error: "Match already exists for this event",
      };
    }
    throw e;
  }
}

// Update a match (optionally changing eventId)
export async function matchUpdate(id: string, data: UpdateMatchInput) {
  const found = await matchGetById(id);
  if (!found.ok) return found;

  // If eventId is changing, validate it
  if (data.eventId) {
    const [ev] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!ev) return { ok: false as const, error: "Invalid eventId" };
  }

  try {
    const [updated] = await db
      .update(matches)
      .set(data)
      .where(eq(matches.id, id))
      .returning();

    if (!updated) return { ok: false as const, error: "Not found" };
    return { ok: true as const, item: updated };
  } catch (e: any) {
    if (e?.code === "23505") {
      return {
        ok: false as const,
        error: "Match already exists for this event",
      };
    }
    throw e;
  }
}

// Delete a match
export async function matchDelete(id: string) {
  const [deleted] = await db
    .delete(matches)
    .where(eq(matches.id, id))
    .returning();

  if (!deleted) return { ok: false as const, error: "Not found" };
  return { ok: true as const };
}

export async function matchListWithLocation() {
  return db
    .select({
      id: matches.id,
      eventId: matches.eventId,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      kickoffAt: matches.kickoffAt,
      externalFixtureId: matches.externalFixtureId,

      // joined event info
      eventTitle: events.title,
      eventStartsAt: events.startsAt,
      eventEndsAt: events.endsAt,

      // joined location info
      locationId: events.locationId,
      city: locations.city,
      venue: locations.venue,
    })
    .from(matches)
    .leftJoin(events, eq(matches.eventId, events.id))
    .leftJoin(locations, eq(events.locationId, locations.id))
    .orderBy(asc(events.startsAt), asc(matches.kickoffAt), asc(matches.id));
}
