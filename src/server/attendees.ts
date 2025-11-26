// src/server/attendees.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";

import { db } from "@/drizzle/drizzle";
import { eq } from "drizzle-orm";
import { attendees } from "@/drizzle/schema/attendees";

export type Attendee = typeof attendees.$inferSelect;

/**
 * Fetch an attendee by email.
 * Mirrors the style of your other server helpers.
 */
export async function attendeeGetByEmail(
  email: string
): Promise<{ ok: true; item: Attendee } | { ok: false; error: string }> {
  try {
    const [row] = await db
      .select()
      .from(attendees)
      .where(eq(attendees.email, email))
      .limit(1);

    if (!row) {
      return {
        ok: false as const,
        error: "Attendee not found",
      };
    }

    return {
      ok: true as const,
      item: row,
    };
  } catch (e: any) {
    console.error("attendeeGetByEmail error:", e);
    return {
      ok: false as const,
      error: "Failed to load attendee",
    };
  }
}
