import { z } from "zod";

export const CreateRegistrationSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().min(3).max(50).optional(),
  source: z.enum(["online", "walkin"]).optional().default("online"),

  // consents
  acceptedTerms: z.boolean(),
  acceptedMarketing: z.boolean(),
  ageGatePassed: z.boolean().optional().default(false),
});

export type CreateRegistrationInput = z.infer<typeof CreateRegistrationSchema>;
