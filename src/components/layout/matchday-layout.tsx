"use client";

import type { ReactNode } from "react";
import MetaPixel from "../plugin/meta-pixel";

type MatchdayLayoutProps = {
  children: ReactNode;
};

export function MatchdayLayout({ children }: MatchdayLayoutProps) {
  return (
    <div
      className="
        relative min-h-screen text-white flex flex-col overflow-hidden
        bg-black
        /* Mobile background */
        bg-[url('https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763472025/Mobile_au5sug.webp')]

        /* Desktop background */
        md:bg-[url('https://centa-hr.s3.eu-west-3.amazonaws.com/companies/019bbc22-ee74-7bfa-a6af-0a801a3d2e24/stores/019bbc3e-20be-7f38-85ed-c6867a6c0cfc/media/files/tmp/019f149c-88ff-7cc1-be38-d2028231761c-guiness-bg.png')]

        bg-cover bg-center
      "
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* <Header /> */}

      <main className="relative z-10 flex-1">
        <MetaPixel />
        <div className="max-w-6xl mx-auto px-4 mt-20">{children}</div>
      </main>
    </div>
  );
}
