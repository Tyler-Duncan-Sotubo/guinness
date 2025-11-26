// app/api/predictions/route.ts
import { z } from "zod";
import {
  predictionCreateOrUpdateForEmail,
  predictionListForEmailAndEvent,
} from "@/server/predictions";

const CreatePredictionSchema = z.object({
  email: z.email(),
  eventId: z.uuid(),
  matchId: z.string().min(1),
  homeScore: z.number().int().min(0).max(10),
  awayScore: z.number().int().min(0).max(10),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = CreatePredictionSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await predictionCreateOrUpdateForEmail(parsed.data);

  if (!result.ok) {
    // Differentiate closed match vs other errors if you like,
    // but 400 is fine for now.
    return Response.json(result, { status: 400 });
  }

  // 201 if new, 200 if updated
  const status = result.item.isNew ? 201 : 200;

  return Response.json(result, { status });
}

/* ---------- GET: list predictions for an email + event ---------- */

const GetPredictionsQuerySchema = z.object({
  email: z.email(),
  eventId: z.uuid(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const parsed = GetPredictionsQuerySchema.safeParse({
    email: searchParams.get("email"),
    eventId: searchParams.get("eventId"),
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Missing or invalid email / eventId" },
      { status: 400 }
    );
  }

  const { email, eventId } = parsed.data;

  const result = await predictionListForEmailAndEvent({ email, eventId });

  if (!result.ok) {
    return Response.json(result, { status: 500 });
  }

  // Always 200 with items: []
  return Response.json(result, { status: 200 });
}
