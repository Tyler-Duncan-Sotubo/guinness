// schema/events.ts
import { z } from "zod";
import { parseISO, isValid } from "date-fns";

const isoString = z.string().refine((s) => {
  const d = parseISO(s);
  return isValid(d);
}, "Invalid ISO datetime");

export const EventStatusEnum = z.enum(["draft", "published", "archived"]);

export const CreateEventSchema = z
  .object({
    locationId: z.string().uuid(),
    title: z.string().min(1),
    startsAt: isoString, // TEXT in DB
    endsAt: isoString, // now required
    isEpic: z.boolean().optional().default(true),
    status: EventStatusEnum.optional().default("published"),
  })
  .refine(
    (v) => parseISO(v.endsAt).getTime() >= parseISO(v.startsAt).getTime(),
    { message: "endsAt must be >= startsAt", path: ["endsAt"] }
  );

export const UpdateEventSchema = z
  .object({
    locationId: z.string().uuid().optional(),
    title: z.string().min(1).optional(),
    startsAt: isoString.optional(),
    endsAt: isoString.optional(),
    isEpic: z.boolean().optional(),
    status: EventStatusEnum.optional(),
  })
  .refine(
    (v) => {
      if (!v.startsAt || !v.endsAt) return true;
      return parseISO(v.endsAt).getTime() >= parseISO(v.startsAt).getTime();
    },
    { message: "endsAt must be >= startsAt", path: ["endsAt"] }
  );

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
