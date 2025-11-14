import { requireUser } from "@/server/auth/guard";
import { eventCreate, eventList } from "@/server/events";
import { CreateEventSchema } from "@/schema/events";

// GET /api/events?locationId=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId") ?? undefined;
  const items = await eventList(locationId);
  return Response.json({ items });
}

// POST /api/events
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const json = await req.json().catch(() => null);
  const parsed = CreateEventSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await eventCreate(parsed.data);
    if (!result.ok) return Response.json(result, { status: 409 });
    return Response.json(result, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    if (e?.code === "23503") {
      // FK violation: location not found
      return Response.json({ error: "Invalid locationId" }, { status: 400 });
    }
    if (e?.code === "23505") {
      return Response.json(
        { error: "Event already exists at this time for this location" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
