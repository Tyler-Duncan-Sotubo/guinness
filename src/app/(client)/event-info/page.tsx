// app/event-info/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { GXButton } from "@/components/ui/gx-button";
import { MatchdayLayout } from "@/components/layout/matchday-layout";
import Spinner from "@/components/widgets/spin-wheel";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { RegisterModal } from "@/components/modal/register-modal";
import { LoginModal } from "@/components/modal/login-modal";

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

export default function EventInfoPage() {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  const [remainingSpins, setRemainingSpins] = useState<number>(3);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  console.log(
    "EventInfoPage isLoggedIn:",
    isLoggedIn,
    "session:",
    session?.user
  );

  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["event-info", eventId],
    queryFn: () => fetchEventWithLocation(eventId as string),
    enabled: !!eventId,
  });

  const friendlyError =
    isError && error instanceof Error
      ? error.message
      : isError
      ? "Failed to load event. Please try again."
      : null;

  const startsDate = event ? new Date(event.startsAt) : null;
  const dateLabel =
    event && startsDate && !isNaN(startsDate.getTime())
      ? startsDate.toLocaleString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })
      : event?.startsAt ?? "";

  const isEpic = event?.isEpic ?? false;

  const handleQuizClick = () => {
    router.push(`/quiz?eventId=${eventId}`);
  };

  if (!eventId) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-4">
          <p className="text-sm text-red-400">
            Missing <code>eventId</code>. Please use a valid event link or pick
            a Match Day again.
          </p>
          <GXButton variant="primary" onClick={() => router.push("/")}>
            Back to homepage
          </GXButton>
        </div>
      </MatchdayLayout>
    );
  }

  if (friendlyError) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-4">
          <p className="text-sm text-red-400">{friendlyError}</p>
          <GXButton variant="primary" onClick={() => router.push("/")}>
            Back to homepage
          </GXButton>
        </div>
      </MatchdayLayout>
    );
  }

  if (isLoading || !event) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-4">
          <p className="text-xs text-neutral-400">Loading event details…</p>
        </div>
      </MatchdayLayout>
    );
  }

  return (
    <MatchdayLayout>
      <div className="mt-8 md:mt-10 px-4 md:px-0">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-start">
          {/* LEFT: Event info */}
          <div className="space-y-8">
            <header className="space-y-3 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[0.7rem] uppercase tracking-[0.2em] text-neutral-300">
                {isEpic ? "Epic Match Day" : "Regular Match Day"}
              </div>

              <h1 className="text-2xl md:text-3xl font-semibold">
                {event.title}
              </h1>

              <p className="text-sm text-neutral-300">
                {event.city}
                {event.venue ? ` · ${event.venue}` : ""}
                <br />
                {dateLabel}
              </p>
            </header>

            <section className="bg-neutral-950/60 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                  Event Info
                </p>
                <p className="text-sm text-neutral-200">{event.description}</p>
              </div>

              {!isEpic && (
                <p className="text-xs text-emerald-300">
                  This is a <strong>Regular</strong> event – free walk-in. Just
                  turn up on the day and scan to play Spin &amp; Win and earn
                  points.
                </p>
              )}

              {isEpic && (
                <p className="text-xs text-amber-300">
                  This is an <strong>EPIC</strong> event – registration is
                  required to secure your place.
                </p>
              )}
            </section>

            <section className="space-y-3">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400 text-center lg:text-left">
                Get involved
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <GXButton
                  variant="secondary"
                  className="w-full sm:flex-1"
                  onClick={handleQuizClick}
                >
                  Match Quiz
                </GXButton>
              </div>
            </section>

            <div className="pt-4 border-t border-neutral-900 mt-6 sm:flex justify-center lg:justify-start hidden">
              <GXButton
                variant="secondary"
                onClick={() => router.push("/")}
                className="w-full sm:w-auto"
              >
                Back to homepage
              </GXButton>
            </div>
          </div>

          {/* RIGHT: Spinner */}
          <div className="space-y-4 lg:space-y-6">
            <div className="flex justify-center lg:justify-center items-center">
              <GXButton
                variant="primary"
                className="w-full sm:w-[60%] lg:w-[50%]"
              >
                Spin &amp; Win
              </GXButton>
            </div>

            <div className="flex justify-center lg:justify-center">
              <div className="w-full max-w-xs sm:max-w-sm">
                <Spinner
                  isLoggedIn={isLoggedIn}
                  remainingSpins={remainingSpins}
                  onLoginClick={() => {
                    if (!isLoggedIn) {
                      setShowLogin(true);
                    }
                  }}
                  dismissibleModal={true}
                />
              </div>
            </div>

            <p className="text-sm text-center max-w-sm mx-auto">
              Try your luck with the Spin &amp; Win wheel to earn points and
              rewards!
            </p>
          </div>
        </div>
      </div>

      <RegisterModal
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        eventId={eventId as string}
        maxSpinsPerEvent={1000}
        onRegistered={(data) => {
          if (data?.spin?.remainingSpins !== undefined) {
            setRemainingSpins(data.spin.remainingSpins);
          }
        }}
        onLoginRequested={() => setShowLogin(true)}
      />

      {!isLoggedIn && (
        <LoginModal
          open={showLogin}
          onOpenChange={setShowLogin}
          onRegisterRequested={() => setRegisterOpen(true)}
        />
      )}
    </MatchdayLayout>
  );
}
