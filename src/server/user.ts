/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { db } from "@/drizzle/drizzle";
import {
  users,
  attendees,
  registrations,
  consents,
  events,
  userEventSpins,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

type Meta = {
  ip?: string | null;
  userAgent?: string | null;
};

export type RegisterAndRegisterInput = {
  eventId: string;
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  source?: "online" | "onsite";
  acceptedTerms: boolean;
  acceptedMarketing: boolean;
  ageGatePassed: boolean;
};

export type RegisterAndRegisterResult =
  | {
      ok: true;
      user: { id: string; name: string | null; email: string };
      attendee: any;
      registration: any;
      event: any;
    }
  | { ok: false; error: string };

export async function registerUserAndRegistration(
  input: RegisterAndRegisterInput,
  meta: Meta = {}
): Promise<RegisterAndRegisterResult> {
  const {
    eventId,
    name,
    email,
    password,
    phone,
    acceptedTerms,
    acceptedMarketing,
    ageGatePassed,
  } = input;
  const { ip, userAgent } = meta;

  // 1) Validate event as in registrationCreate
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return { ok: false, error: "Invalid eventId" };
  }

  if (event.status !== "published") {
    return { ok: false, error: "Event not open for registration" };
  }

  try {
    const now = new Date();
    const startsAt = new Date(event.startsAt);
    if (!Number.isNaN(startsAt.getTime()) && startsAt < now) {
      return { ok: false, error: "Event already started or passed" };
    }
  } catch {
    // ignore parse errors
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await db.transaction(async (tx) => {
      // 2) Check existing user
      const existingUser = await tx.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, normalizedEmail),
        columns: { id: true },
      });

      if (existingUser) {
        return { ok: false as const, error: "Email already registered" };
      }

      // 3) Check existing attendee (even if user missing) => fail
      const [existingAttendee] = await tx
        .select({ id: attendees.id })
        .from(attendees)
        .where(eq(attendees.email, normalizedEmail))
        .limit(1);

      if (existingAttendee) {
        return {
          ok: false as const,
          error: "Email already exists as an attendee",
        };
      }

      // 4) Create user
      const hash = await bcrypt.hash(password, 12);
      const [user] = await tx
        .insert(users)
        .values({
          name,
          email: normalizedEmail,
          password: hash,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
        });

      // 5) Create attendee
      const [attendee] = await tx
        .insert(attendees)
        .values({
          name,
          email: normalizedEmail,
          phone: phone ?? null,
        })
        .returning();

      // 6) Create registration (unique eventId + attendeeId)
      let registration;
      try {
        const [createdReg] = await tx
          .insert(registrations)
          .values({
            eventId,
            attendeeId: attendee.id,
            acceptedTerms,
            acceptedMarketing,
            status: acceptedTerms ? "confirmed" : "pending",
          })
          .returning();
        registration = createdReg;
      } catch (e: any) {
        const code = e?.code ?? e?.cause?.code;
        if (code === "23505") {
          return {
            ok: false as const,
            error: "Already registered",
          };
        }
        throw e;
      }

      if (!registration) {
        return {
          ok: false as const,
          error: "Unknown error creating registration",
        };
      }

      // 7) Consent snapshots (same pattern as your registrationCreate)
      const consentRows: (typeof consents.$inferInsert)[] = [];

      if (ageGatePassed) {
        consentRows.push({
          registrationId: registration.id,
          type: "age_gate",
          value: "accepted",
          ip,
          userAgent,
        });
      }

      consentRows.push({
        registrationId: registration.id,
        type: "terms",
        value: acceptedTerms ? "accepted" : "rejected",
        ip,
        userAgent,
      });

      consentRows.push({
        registrationId: registration.id,
        type: "marketing",
        value: acceptedMarketing ? "accepted" : "rejected",
        ip,
        userAgent,
      });

      if (consentRows.length > 0) {
        await tx.insert(consents).values(consentRows);
      }

      return {
        ok: true as const,
        user,
        attendee,
        registration,
        event,
      };
    });

    return result;
  } catch (e: any) {
    const code = e?.code ?? e?.cause?.code;
    if (code === "23505") {
      return { ok: false as const, error: "Already registered" };
    }
    throw e;
  }
}

export type TrackSpinResult =
  | {
      ok: true;
      totalSpins: number;
      remainingSpins: number;
    }
  | {
      ok: false;
      error: string;
      totalSpins: number;
      remainingSpins: number;
    };

/**
 * Increment spin count for a user on an event, with a hard max limit.
 *
 * - If record doesn't exist → creates it with totalSpins = 1
 * - If totalSpins >= maxSpinsPerEvent → returns ok: false
 * - Otherwise → increments totalSpins and returns remainingSpins
 */
export async function trackSpinForEvent(
  userId: string,
  eventId: string,
  maxSpinsPerEvent: number
): Promise<TrackSpinResult> {
  if (maxSpinsPerEvent <= 0) {
    return {
      ok: false,
      error: "No spins allowed for this event",
      totalSpins: 0,
      remainingSpins: 0,
    };
  }

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    // 1) Check existing row
    const [existing] = await tx
      .select()
      .from(userEventSpins)
      .where(
        eq(userEventSpins.userId, userId) && eq(userEventSpins.eventId, eventId)
      )
      .limit(1);

    // 2) First ever spin for this user+event
    if (!existing) {
      const [inserted] = await tx
        .insert(userEventSpins)
        .values({
          userId,
          eventId,
          totalSpins: 1,
          lastSpinAt: now,
        })
        .returning();

      const remainingSpins = Math.max(maxSpinsPerEvent - 1, 0);

      return {
        ok: true as const,
        totalSpins: inserted.totalSpins,
        remainingSpins,
      };
    }

    // 3) Already at or above limit → block
    if (existing.totalSpins >= maxSpinsPerEvent) {
      return {
        ok: false as const,
        error: "No spins remaining for this event",
        totalSpins: existing.totalSpins,
        remainingSpins: 0,
      };
    }

    // 4) Increment
    const newTotal = existing.totalSpins + 1;

    const [updated] = await tx
      .update(userEventSpins)
      .set({
        totalSpins: newTotal,
        lastSpinAt: now,
      })
      .where(
        eq(userEventSpins.userId, userId) && eq(userEventSpins.eventId, eventId)
      )
      .returning();

    const remainingSpins = Math.max(maxSpinsPerEvent - updated.totalSpins, 0);

    return {
      ok: true as const,
      totalSpins: updated.totalSpins,
      remainingSpins,
    };
  });

  return result;
}
