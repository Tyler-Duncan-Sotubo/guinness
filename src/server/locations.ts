import "server-only";
import { db } from "@/drizzle/drizzle";
import { CreateLocationPayload } from "@/types/locations";
import { and, eq } from "drizzle-orm";
import { locations } from "@/drizzle/schema/locations";

export async function locationList() {
  const items = await db.select().from(locations).orderBy(locations.city);
  return items;
}

export async function locationGetById(id: string) {
  const [item] = await db.select().from(locations).where(eq(locations.id, id));

  if (!item) return { ok: false, error: "Not found" };
  return { ok: true, item };
}

export async function locationCreate({ city, venue }: CreateLocationPayload) {
  // check existing
  const [existing] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.city, city), eq(locations.venue, venue ?? "")));

  if (existing) return { ok: false, error: "Location already exists" };

  const [item] = await db
    .insert(locations)
    .values({
      city,
      venue: venue ?? null,
    })
    .returning();

  return { ok: true, item };
}

export async function locationUpdate(
  id: string,
  data: Partial<CreateLocationPayload>
) {
  await locationGetById(id);
  await db.update(locations).set(data).where(eq(locations.id, id)).returning();

  return { ok: true };
}

export async function locationDelete(id: string) {
  const [item] = await db
    .delete(locations)
    .where(eq(locations.id, id))
    .returning();

  if (!item) return { ok: false, error: "Not found" };
  return { ok: true };
}
