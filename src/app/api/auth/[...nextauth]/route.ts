// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/server/auth/auth";

export const { GET, POST } = handlers;
