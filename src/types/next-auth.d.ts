// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    userId?: string;
    role: "user" | "staff" | "admin";
  }
}
