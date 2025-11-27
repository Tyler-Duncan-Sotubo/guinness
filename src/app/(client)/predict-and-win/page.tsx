// app/predit-and-win/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MatchdayLayout } from "@/components/layout/matchday-layout";
import { GXButton } from "@/components/ui/gx-button";
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
import { format } from "date-fns";
import { MatchItem } from "@/types/matches";

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

  // Fetch predictions for this email + event
  const { data: predictionData, isLoading: isPredictionsLoading } = useQuery({
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

  // Fetch matches for this event
  const { data: matchesData, isLoading: isMatchesLoading } = useQuery<
    MatchItem[]
  >({
    queryKey: ["matches:forEvent", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const res = await fetch(`/api/matches/${eventId}`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      const json = await res.json();
      return (json.items ?? []) as MatchItem[];
    },
    enabled: !!eventId,
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

  if (!predictLoaded || isPredictionsLoading || isMatchesLoading) {
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
              {(!matchesData || matchesData.length === 0) && (
                <p className="text-sm text-neutral-400 mb-4">
                  No matches have been configured for this event yet.
                </p>
              )}

              <div className="space-y-3">
                {matchesData?.map((match) => {
                  const kickoffDate = new Date(match.kickoffAt);

                  const dateLabel = format(kickoffDate, "d MMM");
                  const kickoffLabel = format(kickoffDate, "HH:mm");

                  const open = isMatchOpen(kickoffDate, now);
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
                      className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-3"
                    >
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="space-y-3 text-left">
                          <p className="text-[0.7rem] text-neutral-400">
                            {dateLabel} · {kickoffLabel}
                          </p>

                          {/* Teams block */}
                          <div className="flex flex-col w-full gap-1">
                            {/* Home team row */}
                            <div className="flex items-center justify-between gap-2 w-full">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={TEAM_LOGOS[match.homeTeam]}
                                  alt={match.homeTeam}
                                  width={26}
                                  height={26}
                                  className="shrink-0 rounded-full border border-neutral-800"
                                />

                                {/* Acronym on mobile, full name on sm+ */}
                                <span className="truncate text-base font-semibold text-neutral-50 sm:hidden">
                                  {TEAM_ACRONYMS[match.homeTeam] ??
                                    match.homeTeam}
                                </span>
                                <span className="hidden sm:inline text-base font-semibold text-neutral-50">
                                  {match.homeTeam}
                                </span>
                              </div>

                              {/* Final score (home) */}
                              {match.finalHomeScore != null && (
                                <span className="text-base font-bold text-neutral-100 ml-10">
                                  {match.finalHomeScore}
                                </span>
                              )}
                            </div>

                            {/* Away team row */}
                            <div className="flex items-center justify-between gap-2 w-full">
                              <div className="flex items-center gap-2">
                                <Image
                                  src={TEAM_LOGOS[match.awayTeam]}
                                  alt={match.awayTeam}
                                  width={26}
                                  height={26}
                                  className="shrink-0 rounded-full border border-neutral-800"
                                />

                                {/* Acronym on mobile, full name on sm+ */}
                                <span className="truncate text-base font-semibold text-neutral-50 sm:hidden">
                                  {TEAM_ACRONYMS[match.awayTeam] ??
                                    match.awayTeam}
                                </span>
                                <span className="hidden sm:inline text-base font-semibold text-neutral-50">
                                  {match.awayTeam}
                                </span>
                              </div>

                              {/* Final score (away) */}
                              {match.finalAwayScore != null && (
                                <span className="text-base font-bold text-neutral-100 ml-10">
                                  {match.finalAwayScore}
                                </span>
                              )}
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

                        {/* Action / status */}
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
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-red-400">
                            Predictions closed
                          </p>
                        )}

                        {submitError && (
                          <p className="mt-2 text-xs text-red-400">
                            {submitError}
                          </p>
                        )}
                      </div>

                      {isActive && (
                        <div className="mt-3 border-t border-neutral-800 pt-3 transition-all duration-300 ease-out">
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
                              } catch {
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
