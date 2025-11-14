// src/client/auth.ts (same as before, keep if you like)
export type RegisterPayload = { name: string; email: string; password: string };

// success shape only (Axios throws on non-2xx)
export type RegisterSuccess = {
  ok: true;
  user: { id: string; name: string | null; email: string };
};
