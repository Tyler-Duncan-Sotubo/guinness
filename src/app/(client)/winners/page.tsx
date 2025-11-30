// app/winners/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { MatchdayLayout } from "@/components/layout/matchday-layout";
import { GXButton } from "@/components/ui/gx-button";
import Loading from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Winner = {
  rank: number;
  name: string;
  email: string;
  totalPoints: number;
  percentage: number;
};

export default function WinnersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventId = searchParams.get("eventId");
  const city = searchParams.get("city");

  const { data, isLoading, isError } = useQuery<{ winners: Winner[] }>({
    queryKey: ["winners", eventId],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "csv", city }),
      });
      if (!res.ok) throw new Error("Failed to fetch winners");
      return res.json();
    },
    enabled: !!eventId,
  });

  if (!eventId || !city) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4 text-center">
          <p className="text-sm text-red-400">
            Missing <code>eventId</code> or <code>city</code>. Please use a
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

  if (isLoading) {
    return (
      <MatchdayLayout>
        <Loading />
      </MatchdayLayout>
    );
  }

  if (isError || !data) {
    return (
      <MatchdayLayout>
        <div className="flex flex-col items-center justify-center py-12 space-y-4 px-4 text-center">
          <p className="text-sm text-red-400">
            Couldn&apos;t load winners for this event.
          </p>
          <GXButton
            variant="secondary"
            onClick={() =>
              router.push(`/predict-and-win?city=${city}&eventId=${eventId}`)
            }
          >
            Back to predictions
          </GXButton>
        </div>
      </MatchdayLayout>
    );
  }

  const { winners } = data;

  return (
    <div
      className="
        relative min-h-screen text-white flex flex-col overflow-hidden

        /* Mobile background */
        bg-[url('https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763472025/Mobile_au5sug.webp')]

        /* Desktop background */
        md:bg-[url('https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763472026/Desktop_t6jr2x.webp')]

        bg-cover bg-center
      "
    >
      <div className="mt-8 md:mt-20 px-4 md:px-0">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          <header className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-[0.7rem] uppercase tracking-[0.2em] text-neutral-300">
              Winners · {cityLabel}
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              Guinness Matchday Winners
            </h1>
            <p className="text-sm text-neutral-300">
              Final leaderboard for this event.
            </p>
          </header>

          {winners.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No winners yet. Check back once the event has been scored.
            </p>
          ) : (
            <Table className="bg-transparent">
              <TableHeader>
                <TableRow className="border-neutral-800">
                  <TableHead className="text-neutral-300 w-20">Rank</TableHead>
                  <TableHead className="text-neutral-300">Name</TableHead>
                  <TableHead className="text-neutral-300 hidden sm:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="text-neutral-300 text-right w-32">
                    Points
                  </TableHead>
                  <TableHead className="text-neutral-300 text-right w-32">
                    Accuracy
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((w) => (
                  <TableRow
                    key={w.email}
                    className="border-neutral-800 bg-transparent"
                  >
                    <TableCell className="font-semibold text-neutral-300">
                      #{w.rank}
                    </TableCell>

                    <TableCell className="font-semibold text-neutral-100">
                      {w.name || w.email}
                    </TableCell>

                    <TableCell className="text-neutral-500 hidden sm:table-cell">
                      {w.email}
                    </TableCell>

                    <TableCell className="text-right font-semibold text-neutral-100">
                      {w.totalPoints} pts
                    </TableCell>

                    <TableCell className="text-right text-neutral-400">
                      {w.percentage.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="pt-4 border-t border-neutral-900 my-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <GXButton
              variant="secondary"
              onClick={() =>
                router.push(`/predict-and-win?city=${city}&eventId=${eventId}`)
              }
              className="w-full sm:w-auto"
            >
              Back to Predict &amp; Win
            </GXButton>

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
    </div>
  );
}
