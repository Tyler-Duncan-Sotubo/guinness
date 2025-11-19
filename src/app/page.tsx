/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { ConsentModal } from "@/components/modal/consent-modal";
import { GXButton } from "@/components/ui/gx-button";
import { useAppContext } from "@/server/provider/app-provider";
import { SelectCityModal } from "@/components/modal/select-city-modal";
import { useRouter } from "next/navigation";
import { MatchdayLayout } from "@/components/layout/matchday-layout";
import Image from "next/image";

export default function HomePage() {
  const [showConsent, setShowConsent] = useState(false);
  const { consent, consentLoaded } = useAppContext();
  const [showEpicEvents, setShowEpicEvents] = useState(false);
  const [showRegularEvents, setShowRegularEvents] = useState(false);
  const router = useRouter();

  const hasConsent = consent.ageGatePassed && consent.acceptedTerms;

  // ✅ Open consent automatically on first load (AFTER hydration)
  useEffect(() => {
    if (consentLoaded && !hasConsent) {
      setShowConsent(true);
    }
  }, [consentLoaded, hasConsent]);

  if (!consentLoaded) {
    return null; // prevents hydration mismatch
  }

  return (
    <MatchdayLayout>
      <main className="mt-20 md:mt-10">
        <div className="relative z-10 px-4 py-4">
          {/* Hero section */}
          <section className="grid md:grid-cols-3 gap-10 items-center">
            <div className="hidden md:block relative w-full max-w-sm mx-auto md:max-w-none aspect-3/4 md:aspect-3/5">
              <Image
                src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763043324/guinness-hero_dl8cx7.png"
                alt="Guinness Match Day"
                fill
                priority
                sizes="(min-width: 768px) 33vw, 80vw"
                className="object-contain"
              />
            </div>

            <div className="col-span-2">
              <div className="mb-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight uppercase">
                  Guinness Matchday
                </h1>
              </div>

              <p className="text-neutral-300 text-sm md:text-xl mb-6 max-w-2xl">
                Guinness Matchday was created to revolutionize football viewing
                in Nigeria, turning it into a thrilling shared experience. .
              </p>

              <ul className="text-xs md:text-sm text-neutral-300 space-y-1 mb-8">
                <li>
                  • Deliver elevated viewing experiences for consumers with
                  Guinness at the heart of this experience.
                </li>
                <li>• Cultivate a loyal community of Guinness Football Fans</li>
              </ul>

              <p className="text-[0.7rem] text-neutral-400 max-w-lg">
                You must be{" "}
                <span className="font-semibold text-neutral-200">
                  18 years or older
                </span>{" "}
                to participate. Please drink responsibly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <GXButton
                  variant="primary"
                  onClick={() => setShowEpicEvents(true)}
                >
                  Register for Epic Events
                </GXButton>
                <GXButton
                  variant="secondary"
                  onClick={() => setShowRegularEvents(true)}
                >
                  Regular For Regular Events
                </GXButton>
                <GXButton
                  variant="secondary"
                  onClick={() => router.push("/past-events")}
                >
                  Catch Up With Past Events
                </GXButton>
              </div>
            </div>
          </section>
        </div>

        {/* Consent Modal */}
        <ConsentModal
          open={showConsent}
          onOpenChange={setShowConsent}
          onComplete={() => {
            setShowConsent(false);
          }}
          // showCloseButton={false}
          // dismissible={false}
        />

        {/* City Selection Modal */}
        <SelectCityModal
          open={showEpicEvents}
          onOpenChange={setShowEpicEvents}
          onSelect={(event) => {
            router.push(`/register?eventId=${event.id}`);
          }}
          showEpic={true}
          showRegular={false}
        />

        <SelectCityModal
          open={showRegularEvents}
          onOpenChange={setShowRegularEvents}
          onSelect={(event) => {
            router.push(`/event-info?eventId=${event.id}`);
          }}
          showEpic={false}
          showRegular={true}
        />
      </main>
    </MatchdayLayout>
  );
}
