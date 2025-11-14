// this wraps both /login and /register under (auth)
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-background p-8 rounded-2xl shadow-md border">
        {children}
      </div>
    </div>
  );
}
