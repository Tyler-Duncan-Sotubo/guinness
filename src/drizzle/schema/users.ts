import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

// Role enum
export const userRoleEnum = pgEnum("user_role", ["user", "staff", "admin"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"),

    role: userRoleEnum("role").notNull().default("user"),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    index("users_email_index").on(t.email),
    index("users_role_index").on(t.role),
  ]
);
