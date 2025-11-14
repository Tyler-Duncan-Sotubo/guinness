import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/drizzle/drizzle";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

type Session = {
  accessToken?: string;
  userId?: string;
  role: "user" | "staff" | "admin";
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // no adapter needed for credentials + JWT
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV === "development",
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const u = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.email, email),
        });

        if (!u) return null;

        const ok = await bcrypt.compare(password, u.password || "");
        if (!ok) return null;

        return {
          id: u.id,
          name: u.name ?? undefined,
          email: u.email,
          image: u.image ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // mint a simple app token on first login
      // On initial login
      if (user) {
        // Fetch the user including role
        const [u] = await db.select().from(users).where(eq(users.id, user.id!));

        token.userId = user.id;
        token.accessToken = token.accessToken || `app-${user.id}`;
        token.role = u?.role ?? "user"; // 👈 add role here
      }

      return token;
    },
    async session({ session, token }) {
      (session as Session).accessToken = token.accessToken as
        | string
        | undefined;
      (session as Session).userId = token.userId as string | undefined;
      // 👇 Add this
      (session as Session).role =
        (token.role as "user" | "staff" | "admin") ?? "user";

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});
