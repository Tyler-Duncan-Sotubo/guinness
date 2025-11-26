// app/predit-and-win/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MatchdayLayout } from "@/components/layout/matchday-layout";
import { GXButton } from "@/components/ui/gx-button";
import { DEMO_MATCHES } from "@/lib/demo-matches";
import { isMatchOpen } from "@/lib/match-time";
import { EmailGateModal } from "@/components/modal/email-gate.modal";
import { MatchPredictionForm } from "@/components/form/match-prediction-form";
import Image from "next/image";
import { TEAM_LOGOS } from "@/lib/team-logos";
import { TEAM_ACRONYMS } from "@/lib/team-acronyms";
import { useCreateMutation } from "@/hooks/use-create-mutation";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@/server/provider/app-provider";
import Loading from "@/components/ui/loading";

type PredictionDto = {
  email: string;
  eventId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export default function PredictAndWinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { predictEmail, predictLoaded, setPredictEmail } = useAppContext();

  const city = searchParams.get("city");
  const eventId = searchParams.get("eventId");

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 🔗 keep refs to each match card so we can scroll to it
  const matchRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const createOrUpdatePrediction = useCreateMutation<PredictionDto>({
    endpoint: `/predictions`,
    successMessage: "Prediction saved",
    refetchKey: "prediction",
    onSuccess: () => {
      setSelectedMatchId(null);
      setSubmitError(null);
    },
  });

  const effectiveEmail = verifiedEmail ?? predictEmail;

  const { data: predictionData, isLoading } = useQuery({
    queryKey: ["prediction", effectiveEmail, eventId],
    queryFn: async () => {
      const params = new URLSearchParams({
        email: effectiveEmail!,
        eventId: eventId!,
      });
      const res = await fetch(`/api/predictions?${params.toString()}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!effectiveEmail && !!eventId,
  });

  useEffect(() => {
    if (!predictLoaded) return;

    if (predictEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifiedEmail(predictEmail);
      setEmailModalOpen(false);
    } else {
      setEmailModalOpen(true);
    }
  }, [predictLoaded, predictEmail]);

  // 🧭 whenever a match becomes active, scroll it into view
  useEffect(() => {
    if (!selectedMatchId) return;
    const el = matchRefs.current[selectedMatchId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedMatchId]);

  if (!city || !eventId) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 px-4">
          <p className="text-sm text-red-400">
            Missing <code>city</code> or <code>eventId</code>. Please use a
            valid link.
          </p>
          <GXButton variant="primary" onClick={() => router.push("/")}>
            Back to homepage
          </GXButton>
        </div>
      </MatchdayLayout>
    );
  }

  const cityLabel = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  const handleEmailComplete = (email: string) => {
    setVerifiedEmail(email);
    setPredictEmail(email);
    setEmailModalOpen(false);
  };

  const now = new Date();

  if (!predictLoaded) {
    return (
      <MatchdayLayout>
        <Loading />
      </MatchdayLayout>
    );
  }

  if (isLoading) {
    return (
      <MatchdayLayout>
        <Loading />
      </MatchdayLayout>
    );
  }

  return (
    <MatchdayLayout>
      <div className="mt-8 md:mt-20 px-4 md:px-0">
        <div className="w-full max-w-2xl mx-auto space-y-8">
          <header className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[0.7rem] uppercase tracking-[0.2em] text-neutral-300">
              Predict &amp; Win · {cityLabel}
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold">
              Guinness Matchday Predict &amp; Win
            </h1>

            <p className="text-sm text-neutral-300">
              Choose a live match below and enter your score prediction. You
              can&apos;t predict matches that have already started.
            </p>
          </header>

          {!effectiveEmail ? (
            <section className="bg-neutral-950/60 border border-neutral-800 rounded-3xl p-5 md:p-6 space-y-4 text-center lg:text-left">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Step 1 · Verify your registration
              </p>
              <p className="text-sm text-neutral-200">
                Enter the email you used for Guinness Matchday registration to
                unlock Predict &amp; Win in {cityLabel}.
              </p>
            </section>
          ) : (
            <section>
              <div className="space-y-3">
                {DEMO_MATCHES.map((match) => {
                  const open = isMatchOpen(match.kickoffAt, now);
                  const isActive = open && selectedMatchId === match.id;

                  const existingPrediction = predictionData?.items?.find(
                    (p: { matchId: string }) => p.matchId === match.id
                  );

                  return (
                    <div
                      key={match.id}
                      ref={(el) => {
                        matchRefs.current[match.id] = el;
                      }}
                      className="border border-neutral-800 rounded-2xl px-4 py-3 bg-neutral-950/60 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-3 text-left">
                          <p className="text-[0.7rem] text-neutral-400">
                            {match.dateLabel} · {match.kickoffLabel}
                          </p>

                          <div className="flex items-center justify-center gap-3 w-full">
                            {/* Home team */}
                            <div className="flex items-center gap-2 min-w-0">
                              <Image
                                src={TEAM_LOGOS[match.homeTeam]}
                                alt={match.homeTeam}
                                width={26}
                                height={26}
                                className="rounded-full border border-neutral-800 shrink-0"
                              />
                              <span className="text-sm font-semibold text-neutral-50 truncate sm:hidden">
                                {TEAM_ACRONYMS[match.homeTeam] ??
                                  match.homeTeam}
                              </span>
                              <span className="text-lg font-semibold text-neutral-50 hidden sm:inline">
                                {match.homeTeam}
                              </span>
                            </div>

                            <span className="text-xs md:text-sm uppercase tracking-[0.18em] text-neutral-500 shrink-0">
                              VS
                            </span>

                            {/* Away team */}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-neutral-50 truncate sm:hidden">
                                {TEAM_ACRONYMS[match.awayTeam] ??
                                  match.awayTeam}
                              </span>
                              <span className="text-lg font-semibold text-neutral-50 hidden sm:inline">
                                {match.awayTeam}
                              </span>
                              <Image
                                src={TEAM_LOGOS[match.awayTeam]}
                                alt={match.awayTeam}
                                width={26}
                                height={26}
                                className="rounded-full border border-neutral-800 shrink-0"
                              />
                            </div>
                          </div>

                          {existingPrediction && (
                            <p className="text-[0.9rem] text-emerald-400">
                              Your prediction:{" "}
                              <span className="font-semibold">
                                {existingPrediction.homeScore} -{" "}
                                {existingPrediction.awayScore}
                              </span>
                            </p>
                          )}
                        </div>

                        {open ? (
                          <GXButton
                            variant="primary"
                            onClick={() =>
                              setSelectedMatchId((prev) =>
                                prev === match.id ? null : match.id
                              )
                            }
                          >
                            {isActive
                              ? "Close form"
                              : existingPrediction
                              ? "Edit prediction"
                              : "Make prediction"}
                          </GXButton>
                        ) : (
                          <p className="text-[0.7rem] text-red-400 font-semibold uppercase tracking-[0.18em]">
                            Predictions closed
                          </p>
                        )}

                        {submitError && (
                          <p className="text-xs text-red-400 mt-2">
                            {submitError}
                          </p>
                        )}
                      </div>

                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-neutral-800 transition-all duration-300 ease-out">
                          <MatchPredictionForm
                            homeTeam={match.homeTeam}
                            awayTeam={match.awayTeam}
                            defaultHomeScore={
                              existingPrediction?.homeScore ?? null
                            }
                            defaultAwayScore={
                              existingPrediction?.awayScore ?? null
                            }
                            onSubmitPrediction={async ({
                              homeScore,
                              awayScore,
                            }) => {
                              if (!effectiveEmail || !eventId) return;

                              const dto: PredictionDto = {
                                email: effectiveEmail,
                                eventId,
                                matchId: match.id,
                                homeScore,
                                awayScore,
                              };

                              try {
                                await createOrUpdatePrediction(
                                  dto,
                                  setSubmitError
                                );
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              } catch (error) {
                                setSubmitError(
                                  "Failed to submit prediction: try again later."
                                );
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="pt-4 border-t border-neutral-900 my-10 flex justify-center lg:justify-start">
            <GXButton
              variant="secondary"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto"
            >
              Back to homepage
            </GXButton>
          </div>
        </div>
      </div>

      <EmailGateModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        city={city}
        dismissible={false}
        showCloseButton={false}
        registerHref={eventId ? `/register?eventId=${eventId}` : "/register"}
        onComplete={handleEmailComplete}
      />
    </MatchdayLayout>
  );
}
