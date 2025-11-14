// app/registration-success/page.tsx (or whatever your route is)
"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { GXButton } from "@/components/ui/gx-button";
import { MatchdayLayout } from "@/components/layout/matchday-layout";

type EventWithLocation = {
  id: string;
  locationId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isEpic: boolean;
  status: "draft" | "published" | "archived";
  city?: string | null;
  venue?: string | null;
  description?: string;
};

async function fetchEventWithLocation(
  eventId: string
): Promise<EventWithLocation> {
  const res = await fetch(`/api/events/${eventId}`);
  if (!res.ok) {
    throw new Error("Failed to load event");
  }

  const json: { ok: boolean; item?: EventWithLocation; error?: string } =
    await res.json();

  if (!json.ok || !json.item) {
    throw new Error(json.error || "Event not found");
  }

  return json.item;
}

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["event-success", eventId],
    queryFn: () => fetchEventWithLocation(eventId as string),
    enabled: !!eventId,
  });

  const friendlyError =
    isError && error instanceof Error
      ? error.message
      : isError
      ? "Failed to load event details."
      : null;

  // 🔥 Fire confetti once when success state is ready
  const hasFiredConfettiRef = useRef(false);

  useEffect(() => {
    if (
      !hasFiredConfettiRef.current &&
      !isLoading &&
      !friendlyError &&
      eventId
    ) {
      hasFiredConfettiRef.current = true;

      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.3 },
        angle: 90,
      });
    }
  }, [isLoading, friendlyError, eventId]);

  // Missing eventId entirely
  if (!eventId) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <p className="text-sm text-red-400">
            Missing <code>eventId</code>. Please use a valid registration link.
          </p>
          <GXButton variant="primary" onClick={() => router.push("/")}>
            Back to homepage
          </GXButton>
        </div>
      </MatchdayLayout>
    );
  }

  return (
    <MatchdayLayout>
      <div className="flex flex-col items-center text-center space-y-6 pt-4">
        {/* Loading / error states */}
        {isLoading && (
          <p className="text-xs text-neutral-400">Loading your event…</p>
        )}

        {friendlyError && (
          <>
            <p className="text-sm text-red-400">{friendlyError}</p>
            <GXButton variant="primary" onClick={() => router.push("/")}>
              Back to homepage
            </GXButton>
          </>
        )}

        {!isLoading && !friendlyError && (
          <>
            {/* Checkmark */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <svg
                className="w-10 h-10 text-emerald-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-semibold">You’re all set!</h1>
            <p className="text-neutral-300 max-w-md text-sm">
              Your spot has been secured. Get ready for an unforgettable
              Guinness Match Day experience.
            </p>

            {/* Event details box */}
            <div className="mt-4 w-full max-w-md bg-neutral-950/60 border border-neutral-800 rounded-3xl p-6 space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 mb-1">
                Event Details
              </p>

              <p className="text-lg font-semibold">
                {event?.title ?? `Event ID: ${eventId}`}
              </p>

              {(event?.city || event?.venue) && (
                <p className="text-sm text-neutral-400">
                  {event.city}
                  {event.venue ? ` · ${event.venue}` : ""}
                </p>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <GXButton
                variant="primary"
                onClick={() => router.push("/")}
                className="tracking-[0.22em]"
              >
                Back to homepage
              </GXButton>

              <GXButton
                variant="secondary"
                onClick={() => router.push(`/register?eventId=${eventId}`)}
              >
                Register another person
              </GXButton>
            </div>
          </>
        )}
      </div>
    </MatchdayLayout>
  );
}
