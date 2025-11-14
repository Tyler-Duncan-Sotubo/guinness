import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema"; // import everything from your schema barrel

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

// 👇 Type-safe database instance
export type DB = NodePgDatabase<typeof schema>;

// 👇 Actual instance (typed automatically)
export const db: DB = drizzle(pool, { schema });
