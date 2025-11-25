/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { db } from "@/drizzle/drizzle";
import { asc, eq } from "drizzle-orm";
import { attendees } from "@/drizzle/schema/attendees";
import { registrations } from "@/drizzle/schema/registrations";
import { consents } from "@/drizzle/schema/consents";
import { CreateRegistrationInput } from "@/schema/registrations";
import { eventGetById } from "@/server/events";
import { events, locations } from "@/drizzle/schema";

type Meta = {
  ip?: string;
  userAgent?: string;
};

export async function registrationCreate(
  eventId: string,
  input: CreateRegistrationInput,
  meta: Meta = {}
) {
  const {
    name,
    email,
    phone,
    source = "online",
    acceptedTerms,
    acceptedMarketing,
    ageGatePassed,
  } = input;
  const { ip, userAgent } = meta;

  const eventResult = await eventGetById(eventId);
  if (!eventResult.ok) {
    return { ok: false as const, error: "Invalid eventId" as const };
  }

  const event = eventResult.item;

  if (event.status !== "published") {
    return {
      ok: false as const,
      error: "Event not open for registration" as const,
    };
  }

  if (!event.isEpic) {
    return {
      ok: false as const,
      error: "Event does not accept registrations" as const,
    };
  }

  try {
    const now = new Date();
    const startsAt = new Date(event.startsAt);
    if (!Number.isNaN(startsAt.getTime()) && startsAt < now) {
      return {
        ok: false as const,
        error: "Event already started or passed" as const,
      };
    }
  } catch {
    // ignore parse errors
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1) Find or create attendee
      const [existingAttendee] = await tx
        .select()
        .from(attendees)
        .where(eq(attendees.email, email))
        .limit(1);

      let attendee = existingAttendee;

      if (!attendee) {
        const [created] = await tx
          .insert(attendees)
          .values({
            name,
            email,
            phone,
          })
          .returning();
        attendee = created;
      } else if (attendee.name !== name || attendee.phone !== phone) {
        const [updated] = await tx
          .update(attendees)
          .set({ name, phone })
          .where(eq(attendees.id, attendee.id))
          .returning();
        attendee = updated;
      }

      // 2) Create registration (unique eventId + attendeeId)
      let registration;
      try {
        const [createdReg] = await tx
          .insert(registrations)
          .values({
            eventId,
            attendeeId: attendee.id,
            source,
            acceptedTerms,
            acceptedMarketing,
            status: acceptedTerms ? "confirmed" : "pending",
          })
          .returning();
        registration = createdReg;
      } catch (e: any) {
        const code = e?.code ?? e?.cause?.code;
        if (code === "23505") {
          // unique constraint: registrations_event_attendee_uq
          return {
            ok: false as const,
            error: "Already registered" as const,
          };
        }
        throw e;
      }

      if (!registration) {
        return {
          ok: false as const,
          error: "Unknown error creating registration" as const,
        };
      }

      // 3) Consent snapshots
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
        item: {
          event,
          attendee,
          registration,
        },
      };
    });

    return result;
  } catch (e: any) {
    const code = e?.code ?? e?.cause?.code;
    if (code === "23505") {
      return { ok: false as const, error: "Already registered" as const };
    }
    throw e;
  }
}

// Shape used when listing registrations for an event
export type RegistrationWithAttendee = {
  registrationId: string;
  createdAt: Date | null;
  status: "pending" | "confirmed" | "cancelled" | "attended";
  source: "online" | "walkin";
  attendeeId: string;
  name: string;
  email: string;
  phone: string | null;
};

export async function registrationListByEvent(eventId: string): Promise<
  | {
      ok: true;
      items: (RegistrationWithAttendee & { eventCity: string | null })[];
    }
  | { ok: false; error: string }
> {
  // ensure event exists to give a nice 404 upstream
  const eventResult = await eventGetById(eventId);
  if (!eventResult.ok) {
    return { ok: false as const, error: "Not found" };
  }

  const rows = await db
    .select({
      registrationId: registrations.id,
      createdAt: registrations.createdAt,
      status: registrations.status,
      source: registrations.source,
      attendeeId: attendees.id,
      name: attendees.name,
      email: attendees.email,
      phone: attendees.phone,
      // NEW:
      eventCity: locations.city,
    })
    .from(registrations)
    .innerJoin(attendees, eq(registrations.attendeeId, attendees.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(locations, eq(events.locationId, locations.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(asc(registrations.createdAt), asc(attendees.name));

  return { ok: true as const, items: rows };
}
