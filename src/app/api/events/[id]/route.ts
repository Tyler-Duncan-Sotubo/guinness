import { requireUser } from "@/server/auth/guard";
import {
  eventDelete,
  eventGetWithLocation,
  eventUpdate,
} from "@/server/events";
import { UpdateEventSchema } from "@/schema/events";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const result = await eventGetWithLocation(id); // ⬅️ use joined helper
  if (!result.ok) return Response.json(result, { status: 404 });
  return Response.json(result);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: "Invalid input" }, { status: 400 });

  const result = await eventUpdate(id, parsed.data);
  if (!result.ok)
    return Response.json(result, {
      status: result.error === "Not found" ? 404 : 409,
    });
  return Response.json({
    message: "Event updated successfully",
    item: result.item,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const { id } = await ctx.params;
  const result = await eventDelete(id);
  if (!result.ok) return Response.json(result, { status: 404 });
  return new Response(null, { status: 204 });
}
