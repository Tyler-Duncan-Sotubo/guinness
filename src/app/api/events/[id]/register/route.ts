import { CreateRegistrationSchema } from "@/schema/registrations";
import { registrationCreate } from "@/server/registrations";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = CreateRegistrationSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const ipHeader = req.headers.get("x-forwarded-for") ?? undefined;
  const ip = ipHeader?.split(",")[0]?.trim();
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const result = await registrationCreate(id, parsed.data, { ip, userAgent });

  if (!result.ok) {
    switch (result.error) {
      case "Invalid eventId":
        return Response.json({ error: result.error }, { status: 404 });
      case "Already registered":
        return Response.json({ error: result.error }, { status: 409 });
      case "Event not open for registration":
      case "Event already started or passed":
      case "Event does not accept registrations":
        return Response.json({ error: result.error }, { status: 409 });
      default:
        return Response.json({ error: result.error }, { status: 400 });
    }
  }

  return Response.json(
    {
      message: "Registration created successfully",
      item: result.item,
    },
    { status: 201 }
  );
}
