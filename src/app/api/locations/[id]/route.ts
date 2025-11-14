import { UpdateLocationSchema } from "@/schema/locations";
import { requireUser } from "@/server/auth/guard";
import {
  locationDelete,
  locationGetById,
  locationUpdate,
} from "@/server/locations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const items = await locationGetById(id);
  return Response.json({ items });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const body = await req.json().catch(() => null);
  const parsed = UpdateLocationSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Invalid input" }, { status: 400 });

  const update = parsed.data;
  const { id } = await ctx.params;

  const result = await locationUpdate(id, update);
  if (!result.ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ message: "Location updated successfully" });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const { id } = await ctx.params;
  const result = await locationDelete(id);
  if (!result.ok) return Response.json(result, { status: 404 });
  return new Response(null, { status: 204 });
}
