import "server-only";
import { db } from "@/drizzle/drizzle";
import { users } from "@/drizzle/schema";
import bcrypt from "bcryptjs";

export type RegisterInput = { name: string; email: string; password: string };
export type RegisterResult =
  | { ok: true; user: { id: string; name: string | null; email: string } }
  | { ok: false; error: string };

export async function registerCore({
  name,
  email,
  password,
}: RegisterInput): Promise<RegisterResult> {
  // normalize email if you wish
  const normalizedEmail = email.trim().toLowerCase();

  // check existing
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, normalizedEmail),
    columns: { id: true },
  });

  if (existing) return { ok: false, error: "Email already registered" };

  // hash + create
  const hash = await bcrypt.hash(password, 12);
  const [inserted] = await db
    .insert(users)
    .values({ name, email: normalizedEmail, password: hash })
    .returning({ id: users.id, name: users.name, email: users.email });

  return { ok: true, user: inserted };
}
