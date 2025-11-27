// app/api/matches/route.ts
import { NextRequest, NextResponse } from "next/server";
import { matchCreate, matchListWithLocation } from "@/server/matches";
import { createMatchSchema } from "@/schema/matches";
import { ZodError } from "zod";

export async function GET() {
  const items = await matchListWithLocation();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    // Validate request body against your CreateMatchInput schema
    const input = createMatchSchema.parse(json);

    const result = await matchCreate(input);

    if (!result.ok) {
      // Map your domain errors to HTTP statuses
      if (result.error === "Invalid eventId") {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      if (result.error === "Match already exists for this event") {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }

      // Fallback
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ item: result.item }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.flatten() },
        { status: 400 }
      );
    }

    console.error("POST /api/matches error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
