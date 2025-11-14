"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import Header from "@/components/navigation/header";
import { GXFooter } from "@/components/navigation/gx-footer";

type MatchdayLayoutProps = {
  children: ReactNode;
};

export function MatchdayLayout({ children }: MatchdayLayoutProps) {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* SIDE DECOR ELEMENTS */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* LEFT IMAGE — natural size */}
        <div className="hidden md:block absolute left-0 top-0">
          <Image
            src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763042175/Matchday_KV44_copy_2-removebg-preview_slzuux.png"
            alt=""
            width={300} // ← Use fixed width to preserve PNG size
            height={500} // ← Height keeps image natural (adjust to your file)
            className="object-top"
            priority
          />
        </div>

        {/* RIGHT IMAGE — natural size, flipped */}
        <div className="hidden md:block absolute right-0 top-0">
          <Image
            src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763042175/Matchday_KV44_copy-removebg-preview_z6q1de.png"
            alt=""
            width={300}
            height={500}
            className="object-top"
            priority
          />
        </div>
      </div>

      {/* MAIN PAGE CONTENT */}
      <Header />

      <main className="relative z-10 flex-1">
        <div className="max-w-6xl mx-auto px-4">{children}</div>
      </main>

      <GXFooter />
    </div>
  );
}
