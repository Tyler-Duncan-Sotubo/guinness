import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { locations } from "./schema/locations";
import { events } from "./schema/events";
import * as schema from "./schema";

// Load .env manually (no dotenv dep needed in Node 20+)
// Run with: npx tsx src/drizzle/seed.ts
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

const LOCATION_NAMES = [
  "Owerri",
  "Port Harcourt",
  "Enugu",
  "Awka",
  "Lagos 1",
  "Lagos 2",
  "Ibadan",
  "Benin",
  "Abuja",
  "Jos/Kaduna",
];

type EventSeed = {
  city: string;
  date: string; // YYYY-MM-DD
  isEpic: boolean;
};

// 26 activations derived from the picture
const EVENT_SEEDS: EventSeed[] = [
  // Oct 19 – Regular (5)
  { city: "Owerri", date: "2025-10-19", isEpic: false },
  { city: "Enugu", date: "2025-10-19", isEpic: false },
  { city: "Lagos 1", date: "2025-10-19", isEpic: false },
  { city: "Lagos 2", date: "2025-10-19", isEpic: false },
  { city: "Ibadan", date: "2025-10-19", isEpic: false },

  // Nov 1 – Regular (5)
  { city: "Port Harcourt", date: "2025-11-01", isEpic: false },
  { city: "Awka", date: "2025-11-01", isEpic: false },
  { city: "Lagos 1", date: "2025-11-01", isEpic: false },
  { city: "Benin", date: "2025-11-01", isEpic: false },
  { city: "Abuja", date: "2025-11-01", isEpic: false },

  // Nov 23 – Regular (5)
  { city: "Owerri", date: "2025-11-23", isEpic: false },
  { city: "Enugu", date: "2025-11-23", isEpic: false },
  { city: "Lagos 2", date: "2025-11-23", isEpic: false },
  { city: "Ibadan", date: "2025-11-23", isEpic: false },
  { city: "Jos/Kaduna", date: "2025-11-23", isEpic: false },

  // Nov 30 – Epic (2)
  { city: "Owerri", date: "2025-11-30", isEpic: true },
  { city: "Abuja", date: "2025-11-30", isEpic: true },

  // Nov 30 – Regular (5)
  { city: "Awka", date: "2025-11-30", isEpic: false },
  { city: "Lagos 1", date: "2025-11-30", isEpic: false },
  { city: "Lagos 2", date: "2025-11-30", isEpic: false },
  { city: "Benin", date: "2025-11-30", isEpic: false },
  { city: "Jos/Kaduna", date: "2025-11-30", isEpic: false },

  // Dec 6 – Epic (1)
  { city: "Lagos 1", date: "2025-12-06", isEpic: true },

  // Dec 6 – Regular (3)
  { city: "Port Harcourt", date: "2025-12-06", isEpic: false },
  { city: "Ibadan", date: "2025-12-06", isEpic: false },
  { city: "Abuja", date: "2025-12-06", isEpic: false },
];

async function seed() {
  console.log("Seeding locations...");
  const insertedLocations = await db
    .insert(locations)
    .values(LOCATION_NAMES.map((city) => ({ city })))
    .onConflictDoNothing()
    .returning({ id: locations.id, city: locations.city });

  const cityToId = Object.fromEntries(
    insertedLocations.map((l) => [l.city, l.id])
  );
  console.log(`Inserted ${insertedLocations.length} locations.`);

  console.log("Seeding events...");
  const eventRows = EVENT_SEEDS.map((e) => {
    const locationId = cityToId[e.city];
    if (!locationId) throw new Error(`No location ID found for city: ${e.city}`);

    const typeLabel = e.isEpic ? "EPIC" : "Match Day";
    const title = `Guinness ${typeLabel} - ${e.city}`;
    const startsAt = `${e.date}T17:00:00.000Z`;
    const endsAt = `${e.date}T21:00:00.000Z`;

    return { locationId, title, startsAt, endsAt, isEpic: e.isEpic, status: "published" as const };
  });

  const insertedEvents = await db
    .insert(events)
    .values(eventRows)
    .onConflictDoNothing()
    .returning({ id: events.id, title: events.title });

  console.log(`Inserted ${insertedEvents.length} events.`);
  insertedEvents.forEach((e) => console.log(` - ${e.title}`));

  await pool.end();
  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
