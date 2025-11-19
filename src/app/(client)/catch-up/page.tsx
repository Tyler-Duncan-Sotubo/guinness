"use client";

import { MatchdayLayout } from "@/components/layout/matchday-layout";
import { GXButton } from "@/components/ui/gx-button";
import { useRouter } from "next/navigation";

export default function CatchUpPage() {
  const router = useRouter();

  return (
    <MatchdayLayout>
      <section className="flex flex-col items-center justify-center h-[70vh] px-4 space-y-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-100 mb-4 capitalize">
            watch this space
          </h1>
          <p className="text-neutral-400 text-sm md:text-lg max-w-md mx-auto">
            Catch up with all past Guinness Matchday events here soon.
          </p>
        </div>
        <GXButton variant="primary" onClick={() => router.push("/")}>
          Back to homepage
        </GXButton>
      </section>
    </MatchdayLayout>
  );
}
