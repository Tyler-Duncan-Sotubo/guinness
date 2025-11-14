import { registerUserAndRegistration, trackSpinForEvent } from "@/server/user";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// incoming body validation
const RegisterAndSpinSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().nullable().optional(),
  source: z.enum(["online", "onsite"]).optional().default("online"),
  acceptedTerms: z.boolean(),
  acceptedMarketing: z.boolean(),
  ageGatePassed: z.boolean(),
  maxSpinsPerEvent: z.number().min(1).default(1),
});

export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;

  const json = await req.json().catch(() => null);
  const parsed = RegisterAndSpinSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const {
    name,
    email,
    password,
    phone,
    source,
    acceptedTerms,
    acceptedMarketing,
    ageGatePassed,
    maxSpinsPerEvent,
  } = parsed.data;

  const ipHeader = req.headers.get("x-forwarded-for") ?? undefined;
  const ip = ipHeader?.split(",")[0]?.trim();
  const userAgent = req.headers.get("user-agent") ?? undefined;

  //
  // STEP 1 — Register user + attendee + registration
  //
  const result = await registerUserAndRegistration(
    {
      eventId,
      name,
      email,
      password,
      phone,
      source,
      acceptedTerms,
      acceptedMarketing,
      ageGatePassed,
    },
    { ip, userAgent }
  );

  //
  // Handle registration errors exactly as your registration route
  //
  if (!result.ok) {
    switch (result.error) {
      case "Invalid eventId":
        return Response.json({ error: result.error }, { status: 404 });

      case "Email already registered":
      case "Email already exists as an attendee":
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

  //
  // STEP 2 — Track spin for this user/event
  //
  const spin = await trackSpinForEvent(
    result.user.id,
    eventId,
    maxSpinsPerEvent
  );

  if (!spin.ok) {
    // still return user + attendee + registration (those succeeded)
    return Response.json(
      {
        error: spin.error,
        totalSpins: spin.totalSpins,
        remainingSpins: spin.remainingSpins,
        user: result.user,
        attendee: result.attendee,
        registration: result.registration,
        event: result.event,
      },
      { status: 409 }
    );
  }

  //
  // SUCCESS: everything done
  //
  return Response.json(
    {
      message:
        "User registered, attendee created, registration created, and spin recorded.",
      user: result.user,
      attendee: result.attendee,
      registration: result.registration,
      event: result.event,
      spin: {
        totalSpins: spin.totalSpins,
        remainingSpins: spin.remainingSpins,
      },
    },
    { status: 201 }
  );
}
