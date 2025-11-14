import { CreateLocationSchema } from "@/schema/locations";
import { requireUser } from "@/server/auth/guard";
import { locationCreate, locationList } from "@/server/locations";

export async function GET() {
  const items = await locationList();
  return Response.json({ items });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const json = await req.json().catch(() => null);
  const parsed = CreateLocationSchema.safeParse(json);
  if (!parsed.success)
    return Response.json({ error: "Invalid input" }, { status: 400 });

  const { city, venue } = parsed.data;

  try {
    const result = await locationCreate({ city, venue });
    if (!result.ok) return Response.json(result, { status: 409 });

    return Response.json(result, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    // 23505 = unique violation (city+venue)
    if (e?.code === "23505")
      return Response.json(
        { error: "Location already exists" },
        { status: 409 }
      );
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
