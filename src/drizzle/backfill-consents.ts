import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { registrations } from "./schema/registrations";
import { consents } from "./schema/consents";
import * as schema from "./schema";
import { notInArray } from "drizzle-orm";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });

async function main() {
  const withConsents = await db
    .selectDistinct({ id: consents.registrationId })
    .from(consents);

  const excludeIds = withConsents.map((r) => r.id).filter(Boolean) as string[];

  const regs =
    excludeIds.length > 0
      ? await db
          .select({ id: registrations.id })
          .from(registrations)
          .where(notInArray(registrations.id, excludeIds))
      : await db.select({ id: registrations.id }).from(registrations);

  console.log(`Backfilling consents for ${regs.length} registrations...`);

  for (const reg of regs) {
    await db.insert(consents).values([
      { registrationId: reg.id, type: "age_gate", value: "accepted" },
      { registrationId: reg.id, type: "terms", value: "accepted" },
      { registrationId: reg.id, type: "marketing", value: "accepted" },
    ]);
  }

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
