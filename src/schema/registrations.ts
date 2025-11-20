import { z } from "zod";

export const CreateRegistrationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(3).max(50).optional().or(z.literal("")), // 👈 allow empty string from the form

  source: z.enum(["online", "walkin"]).optional().default("online"),

  acceptedTerms: z.boolean(),
  acceptedMarketing: z.boolean(),
  ageGatePassed: z.boolean().optional().default(false),
});

export type CreateRegistrationInput = z.infer<typeof CreateRegistrationSchema>;
