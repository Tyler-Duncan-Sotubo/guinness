import { requireUser } from "@/server/auth/guard";
import { registrationListByEvent } from "@/server/registrations";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await requireUser();
  if (!user.ok) return user.response;

  const { id } = await ctx.params;

  const result = await registrationListByEvent(id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 404 });
  }

  return Response.json({ items: result.items }, { status: 200 });
}
