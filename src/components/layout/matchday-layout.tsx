"use client";

import type { ReactNode } from "react";

type MatchdayLayoutProps = {
  children: ReactNode;
};

export function MatchdayLayout({ children }: MatchdayLayoutProps) {
  return (
    <div
      className="
        relative min-h-screen text-white flex flex-col overflow-hidden

        /* Mobile background */
        bg-[url('https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763472025/Mobile_au5sug.webp')]

        /* Desktop background */
        md:bg-[url('https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763472026/Desktop_t6jr2x.webp')]

        bg-cover bg-center
      "
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* <Header /> */}

      <main className="relative z-10 flex-1">
        <div className="max-w-6xl mx-auto px-4 mt-20">{children}</div>
      </main>
    </div>
  );
}
