"use client";

import { useState } from "react";
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
  const [showSelectCity, setShowSelectCity] = useState(false);
  const router = useRouter();

  const hasConsent = consent.ageGatePassed && consent.acceptedTerms;

  if (!consentLoaded) {
    return null; // or a skeleton, but no text to avoid mismatch
  }

  const handleConsentComplete = () => {
    setShowSelectCity(true); // open city modal next
  };

  return (
    <MatchdayLayout>
      <main className="mt-20 md:mt-10">
        <div className="relative z-10 px-4 py-4">
          {/* Hero section */}
          <section className="grid md:grid-cols-3 gap-10 md:gap-16 items-start ">
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

            {/* Right side: “How it works” */}
            <div className=" col-span-2">
              <div>
                <div className="mb-4">
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight ">
                    EPIC LIVE FOOTBALL EXPERIENCE
                  </h1>

                  <p className="text-amber-400 text-2xl">Pick your city.</p>
                </div>

                <p className="text-neutral-300 text-sm md:text-xl mb-6 max-w-2xl">
                  Epic live football, by the fans, for the fans. Experience
                  massive screens, powerful audio, and an electric atmosphere.
                  Choose your city, register, and be part of the Guinness Match
                  Day experience.
                </p>

                <ul className="text-xs md:text-sm text-neutral-300 space-y-1 mb-8">
                  <li>• 10 cities</li>
                  <li>• 24 Match Day events</li>
                  <li>• EPIC registration-only events</li>
                  <li>• Live football, music, games & more</li>
                </ul>
                <p className="text-[0.7rem] text-neutral-400 max-w-lg">
                  You must be{" "}
                  <span className="font-semibold text-neutral-200">
                    18 years or older
                  </span>{" "}
                  to participate. Please drink responsibly.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-10">
                {hasConsent ? (
                  <GXButton
                    variant="primary"
                    onClick={() => setShowSelectCity(true)}
                  >
                    Register Here
                  </GXButton>
                ) : (
                  <GXButton
                    variant="primary"
                    onClick={() => setShowConsent(true)}
                  >
                    Register Here
                  </GXButton>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Consent modal */}
        <ConsentModal
          open={showConsent}
          onOpenChange={setShowConsent}
          onComplete={handleConsentComplete}
        />

        <SelectCityModal
          open={showSelectCity}
          onOpenChange={setShowSelectCity}
          onSelect={(event) => {
            if (event.isEpic) {
              // EPIC event → go to registration
              router.push(`/register?eventId=${event.id}`);
            } else {
              router.push(`/event-info?eventId=${event.id}`);
            }
          }}
        />
      </main>
    </MatchdayLayout>
  );
}
