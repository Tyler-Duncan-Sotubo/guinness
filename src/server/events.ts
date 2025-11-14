/* eslint-disable @typescript-eslint/no-explicit-any */
// server/events.ts
import "server-only";
import { db } from "@/drizzle/drizzle";
import { eq, asc } from "drizzle-orm";
import { events } from "@/drizzle/schema/events";
import { locations } from "@/drizzle/schema/locations";
import { CreateEventInput, UpdateEventInput } from "@/schema/events";

export async function eventList(locationId?: string) {
  if (locationId) {
    return db
      .select()
      .from(events)
      .where(eq(events.locationId, locationId))
      .orderBy(asc(events.startsAt), asc(events.title)); // lexicographic; OK if ISO
  }
  return db
    .select()
    .from(events)
    .orderBy(asc(events.startsAt), asc(events.title));
}

export async function eventGetById(id: string) {
  const [item] = await db.select().from(events).where(eq(events.id, id));
  if (!item) return { ok: false as const, error: "Not found" };
  return { ok: true as const, item };
}

export async function eventCreate(input: CreateEventInput) {
  const [loc] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.id, input.locationId))
    .limit(1);
  if (!loc) return { ok: false as const, error: "Invalid locationId" };

  try {
    const [item] = await db.insert(events).values(input).returning();
    return { ok: true as const, item };
  } catch (e: any) {
    if (e?.code === "23505") {
      return {
        ok: false as const,
        error: "Event already exists at this time for this location",
      };
    }
    throw e;
  }
}

export async function eventUpdate(id: string, data: UpdateEventInput) {
  const found = await eventGetById(id);
  if (!found.ok) return found;

  if (data.locationId) {
    const [loc] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.id, data.locationId))
      .limit(1);
    if (!loc) return { ok: false as const, error: "Invalid locationId" };
  }

  try {
    const [updated] = await db
      .update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();

    if (!updated) return { ok: false as const, error: "Not found" };
    return { ok: true as const, item: updated };
  } catch (e: any) {
    if (e?.code === "23505") {
      return {
        ok: false as const,
        error: "Event already exists at this time for this location",
      };
    }
    throw e;
  }
}

export async function eventDelete(id: string) {
  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, id))
    .returning();
  if (!deleted) return { ok: false as const, error: "Not found" };
  return { ok: true as const };
}

export async function eventGetWithLocation(id: string) {
  const [row] = await db
    .select({
      id: events.id,
      locationId: events.locationId,
      title: events.title,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      isEpic: events.isEpic,
      status: events.status,
      // joined fields
      city: locations.city,
      venue: locations.venue,
    })
    .from(events)
    .leftJoin(locations, eq(events.locationId, locations.id))
    .where(eq(events.id, id));

  if (!row) {
    return { ok: false as const, error: "Not found" };
  }

  // you can also add a computed description here if you like
  const description = row.isEpic
    ? "An exclusive Guinness EPIC Match Day with limited places, premium viewing, and special surprises."
    : "A free walk-in Guinness Match Day watch party with great atmosphere, prizes and Spin & Win.";

  return {
    ok: true as const,
    item: {
      ...row,
      description,
    },
  };
}
