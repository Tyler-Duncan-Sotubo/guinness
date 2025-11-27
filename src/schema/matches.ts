import { z } from "zod";

// ------------------------------
// CreateMatchInput
// ------------------------------
export const createMatchSchema = z.object({
  eventId: z
    .uuid("eventId must be a valid UUID")
    .describe("Event this match belongs to"),
  homeTeam: z.string().min(1, "Home team is required"),
  awayTeam: z.string().min(1, "Away team is required"),
  kickoffAt: z.coerce.date().describe("Kickoff date/time"),
  externalFixtureId: z
    .string()
    .min(1, "External fixture ID is required")
    .describe(
      "ID from football API (API-Football / football-data / Sportmonks)"
    ),
});

// Export as TypeScript type
export type CreateMatchInput = z.infer<typeof createMatchSchema>;

// ------------------------------
// UpdateMatchInput
// ------------------------------
// All fields optional except `id` (passed separately in the route)
export const updateMatchSchema = createMatchSchema.partial();

// Export TypeScript type
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
