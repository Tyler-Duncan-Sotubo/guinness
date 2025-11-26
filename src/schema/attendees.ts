// src/schema/attendees.ts
import { z } from "zod";

export const AttendeeLookupSchema = z.object({
  email: z.email("Invalid email address"),
});

export type AttendeeLookupInput = z.infer<typeof AttendeeLookupSchema>;
