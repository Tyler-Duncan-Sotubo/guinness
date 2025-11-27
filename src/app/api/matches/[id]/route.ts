/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/matches/[id]/route.ts
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateMatchSchema } from "@/schema/matches";
import { matchList, matchUpdate, matchDelete } from "@/server/matches";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const items = await matchList(id);

  return NextResponse.json({ items });
}

// PATCH /api/matches/:id
// Here we treat :id as match.id and update that single match
export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  try {
    const json = await req.json();
    const data = updateMatchSchema.parse(json);

    const result = await matchUpdate(id, data);

    if (!result.ok) {
      if (result.error === "Not found") {
        return NextResponse.json({ error: "Match not found" }, { status: 404 });
      }
      if (result.error === "Invalid eventId") {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      if (result.error === "Match already exists for this event") {
        return NextResponse.json({ error: result.error }, { status: 409 });
      }

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ item: result.item });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.flatten() },
        { status: 400 }
      );
    }

    const anyErr = err as any;
    if (anyErr?.code === "23505") {
      return NextResponse.json(
        { error: "Match already exists for this event" },
        { status: 409 }
      );
    }

    console.error("PATCH /api/matches/:id error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/matches/:id
// Here we treat :id as match.id and delete that single match
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  const result = await matchDelete(id);

  if (!result.ok) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
