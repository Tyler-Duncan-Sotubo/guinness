import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

async function main() {
  const before = await db
    .select({ title: schema.events.title, status: schema.events.status })
    .from(schema.events);

  console.log("Before:");
  before.forEach((e) => console.log(`  [${e.status}] ${e.title}`));

  const result = await db
    .update(schema.events)
    .set({ status: "published" })
    .returning({ id: schema.events.id });

  console.log(`\nPublished ${result.length} events.`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
