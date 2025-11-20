"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { GXButton } from "@/components/ui/gx-button";
import Link from "next/link";
import { MatchdayLayout } from "@/components/layout/matchday-layout";

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  // Fire confetti once
  const hasFiredConfettiRef = useRef(false);

  useEffect(() => {
    if (!hasFiredConfettiRef.current && eventId) {
      hasFiredConfettiRef.current = true;

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.3 },
        angle: 90,
      });
    }
  }, [eventId]);

  // If no eventId
  if (!eventId) {
    return (
      <div
        className="
          relative min-h-screen flex flex-col text-white overflow-hidden
          bg-[url('https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763544510/WhatsApp_Image_2025-11-17_at_22.23.55_6e9885a3_ga769j.jpg')]
          bg-cover bg-center
        "
      >
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center space-y-4">
          <p className="text-sm text-red-400">
            Missing <code>eventId</code>. Please use a valid registration link.
          </p>
          <GXButton variant="primary" onClick={() => router.push("/")}>
            Back to homepage
          </GXButton>
        </div>
      </div>
    );
  }

  return (
    <MatchdayLayout>
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <div className="relative z-10 px-4 py-8 flex-1 flex items-end justify-center">
        <div className="flex flex-col items-center text-center space-y-6 pt-4">
          <svg className="w-20 h-20 mb-4" viewBox="0 0 52 52">
            <circle
              className="stroke-[#40bcbc]"
              cx="26"
              cy="26"
              r="25"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray: "157",
                strokeDashoffset: "157",
                animation: "circle-animation 0.6s ease-out forwards",
              }}
            ></circle>

            <path
              className="stroke-[#40bcbc]"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              d="M16 27 L23 34 L36 20"
              style={{
                strokeDasharray: "40",
                strokeDashoffset: "40",
                animation: "check-animation 0.3s ease-out 0.6s forwards",
              }}
            />
          </svg>

          <style jsx>{`
            @keyframes circle-animation {
              to {
                stroke-dashoffset: 0;
              }
            }
            @keyframes check-animation {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}</style>

          {/* SUCCESS */}
          <h1 className="text-3xl font-semibold">You’re all set!</h1>
          <p className="text-white max-w-md text-md">
            Your spot has been secured. Get ready for an unforgettable Guinness
            Match Day experience.
          </p>

          {/* EVENT TITLE (Static, edit as needed) */}
          <div className="mt-4 w-full max-w-md space-y-2">
            <p className="text-3xl font-bold uppercase tracking-widest mb-1">
              EPIC LIVE FOOTBALL EXPERIENCE
            </p>

            {/* DATE CARD */}
            <section className="w-full mx-auto mt-8 flex justify-center">
              <div className="flex items-center bg-black border-2 border-amber-400 rounded-lg px-4 py-2 text-white h-18">
                {/* SUN (vertical) */}
                <span className="text-xl font-semibold rotate-90 tracking-wide text-[#40bcbc] leading-none">
                  SUN
                </span>

                {/* 30 */}
                <span className="text-5xl font-bold leading-none mx-0">30</span>

                {/* NOV / 2025 */}
                <div className="flex flex-col justify-center leading-none mx-1">
                  <span className="text-xl font-semibold text-amber-400 leading-none">
                    NOV
                  </span>
                  <span className="text-xl font-semibold text-amber-400 leading-none">
                    2025
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <GXButton
              variant="secondary"
              onClick={() => router.push("/catch-up")}
            >
              Catch Up With Past Events
            </GXButton>

            <Link
              href="https://fantasy.premierleague.com/leagues/auto-join/ehi1qz"
              target="_blank"
            >
              <GXButton
                variant="primary"
                leftIcon="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763564201/Premier-League-Logo_b7h5j2.png"
                leftIconAlt="Premier League Logo"
              >
                Guinness FPL Join Now
              </GXButton>
            </Link>
            <GXButton variant="secondary" onClick={() => router.push("/")}>
              Back to homepage
            </GXButton>
          </div>
        </div>
      </div>
    </MatchdayLayout>
  );
}
