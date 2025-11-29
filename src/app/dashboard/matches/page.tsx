"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, isAxiosError } from "@/lib/axios";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import Loading from "@/components/ui/loading";
import MatchesTable from "@/components/widgets/matches-table"; // adjust path if needed
import { MatchItem } from "@/types/matches";
import { GXButton } from "@/components/ui/gx-button";
import { IoRefreshCircleOutline } from "react-icons/io5";

export default function MatchesPage() {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const fetchMatches = async (): Promise<MatchItem[]> => {
    try {
      const res = await api.get("/matches");
      // expecting { items: MatchItem[] }
      return res.data.items ?? [];
    } catch (error) {
      if (isAxiosError(error) && error.response) return [];
      throw error;
    }
  };

  const SyncLatestResults = async () => {
    try {
      setIsSyncing(true);
      const res = await api.get("/fixtures/sync-results", {
        headers: {
          "x-cron-key": process.env.CRON_SECRET || "",
        },
      });
      // expecting { items: MatchItem[] }
      return res.data.updated ?? 0;
    } catch (error) {
      if (isAxiosError(error) && error.response) return 0;
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const {
    data: matches,
    isLoading,
    isError,
    refetch,
  } = useQuery<MatchItem[]>({
    queryKey: ["matches"],
    queryFn: fetchMatches,
  });

  if (isLoading) return <Loading />;

  if (isError)
    return (
      <ErrorState
        message="Error fetching matches."
        onRetry={refetch}
        isLoading={isLoading}
      />
    );

  return (
    <section className="px-5">
      <PageHeader
        title="Matches"
        description="Manage scheduled matches for all events."
      >
        <GXButton onClick={SyncLatestResults}>
          <span className={isSyncing ? "animate-spin" : ""}>
            <IoRefreshCircleOutline size={30} />
          </span>
          Sync Results
        </GXButton>
      </PageHeader>

      {Array.isArray(matches) && matches.length > 0 ? (
        <MatchesTable data={matches} />
      ) : (
        <div className="mt-20">
          <EmptyState
            title="No Matches Yet"
            description="Create your first match to start collecting predictions."
            image="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1757585351/expense_dypnis.svg"
          />
        </div>
      )}
    </section>
  );
}
