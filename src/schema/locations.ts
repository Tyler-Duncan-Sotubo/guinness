import { z } from "zod";
export const CreateLocationSchema = z.object({
  city: z.string().min(1),
  venue: z.string().optional(),
});
export const UpdateLocationSchema = CreateLocationSchema.partial();
