import { z } from "zod";
import { registerCore } from "@/server/auth/register";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = RegisterSchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json(
        { ok: false, error: "Invalid input" },
        { status: 400 }
      );
    }

    const result = await registerCore(parsed.data);
    if (!result.ok) return Response.json(result, { status: 409 });

    return Response.json(result, { status: 201 });
  } catch {
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
