import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { attendees } from "./schema/attendees";
import { registrations } from "./schema/registrations";
import { consents } from "./schema/consents";
import { events } from "./schema/events";
import { locations } from "./schema/locations";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

type CsvRow = { name: string; email: string; phone: string | null };

function parsePhone(raw: string): string | null {
  if (!raw) return null;
  // Strip Excel CSV formula wrapper: ="07062382377" → 07062382377
  const cleaned = raw.replace(/^="?/, "").replace(/"?$/, "").trim();
  // Strip garbled ± prefix (encoding artifact)
  return cleaned.replace(/^[Â±±]+/, "+") || null;
}

function parseCsv(filepath: string): CsvRow[] {
  const content = readFileSync(filepath, "utf-8");
  const lines = content.split("\n").filter(Boolean);
  // Skip header row
  return lines.slice(1).map((line) => {
    // CSV columns: "Name","Email","Phone","Created At"
    // Use a simple split that respects quoted fields
    const cols = line.match(/("(?:[^"]|"")*"|[^,]*)/g) ?? [];
    const get = (i: number) => (cols[i] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
    return {
      name: get(0),
      email: get(2), // index 2 skips the comma inside ="..."
      phone: parsePhone(get(4)),
    };
  }).filter((r) => r.email && r.email.includes("@"));
}

async function getEpicEventId(city: string): Promise<string> {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .leftJoin(locations, eq(events.locationId, locations.id))
    .where(and(eq(locations.city, city), eq(events.isEpic, true)))
    .limit(1);
  if (!row) throw new Error(`No Epic event found for city: ${city}`);
  return row.id;
}

async function seedRegistrations(city: string, csvPath: string) {
  console.log(`\nSeeding registrations for ${city}...`);
  const rows = parseCsv(csvPath);
  console.log(`  Parsed ${rows.length} rows from CSV`);

  const eventId = await getEpicEventId(city);
  console.log(`  Event ID: ${eventId}`);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    // Upsert attendee by email
    const existing = await db
      .select({ id: attendees.id })
      .from(attendees)
      .where(eq(attendees.email, row.email.toLowerCase()))
      .limit(1);

    let attendeeId: string;

    if (existing.length > 0) {
      attendeeId = existing[0].id;
    } else {
      const [inserted_] = await db
        .insert(attendees)
        .values({
          name: row.name,
          email: row.email.toLowerCase(),
          phone: row.phone,
        })
        .returning({ id: attendees.id });
      attendeeId = inserted_.id;
    }

    // Insert registration (skip if duplicate)
    try {
      const [reg] = await db.insert(registrations).values({
        eventId,
        attendeeId,
        source: "online",
        acceptedTerms: true,
        acceptedMarketing: true,
        status: "confirmed",
      }).returning({ id: registrations.id });

      // Consent snapshots — mirrors what registrationCreate does
      await db.insert(consents).values([
        { registrationId: reg.id, type: "age_gate", value: "accepted" },
        { registrationId: reg.id, type: "terms",    value: "accepted" },
        { registrationId: reg.id, type: "marketing", value: "accepted" },
      ]);

      inserted++;
    } catch {
      skipped++;
    }
  }

  console.log(`  Inserted ${inserted} registrations, skipped ${skipped} duplicates`);
}

async function main() {
  const dir = new URL(".", import.meta.url).pathname;

  await seedRegistrations("Abuja", join(dir, "registrations_abuja.csv"));
  await seedRegistrations("Owerri", join(dir, "registrations_owerri.csv"));

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
