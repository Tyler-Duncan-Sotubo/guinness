import { auth } from "./auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: new Response("Unauthorized", { status: 401 }),
    };
  }
  return { ok: true as const, session };
}
