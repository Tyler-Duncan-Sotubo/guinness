// app/api/attendees/route.ts
import { AttendeeLookupSchema } from "@/schema/attendees";
import { attendeeGetByEmail } from "@/server/attendees";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = AttendeeLookupSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const result = await attendeeGetByEmail(email);

  if (!result.ok) {
    return Response.json(
      { ok: false, error: "Attendee not found" },
      { status: 404 }
    );
  }

  return Response.json(
    {
      ok: true,
      item: result.item,
    },
    { status: 200 }
  );
}

// Optional: reject GET if you only want this as a "check" endpoint
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
