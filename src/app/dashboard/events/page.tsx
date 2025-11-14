"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import ErrorState from "@/components/ui/error-state";
import Loading from "@/components/ui/loading";
import EventsTable from "@/components/widgets/events-table";
import EventModal from "@/components/modal/event-modal";
import { api, isAxiosError } from "@/lib/axios";
import type { EventItem } from "@/types/events";

export default function EventsIndexPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const fetchEvents = async (): Promise<EventItem[]> => {
    try {
      const res = await api.get("/events");
      return res.data.items ?? [];
    } catch (error) {
      if (isAxiosError(error) && error.response) return [];
      throw error;
    }
  };

  const {
    data: events,
    isLoading,
    isError,
    refetch,
  } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: fetchEvents,
  });

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <ErrorState
        message="Error fetching events."
        onRetry={refetch}
        isLoading={isLoading}
      />
    );

  return (
    <section className="px-5">
      <PageHeader title="Events" description="Manage scheduled events.">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          Add Event
        </Button>
      </PageHeader>

      {Array.isArray(events) && events.length > 0 ? (
        <EventsTable data={events} />
      ) : (
        <div className="mt-20">
          <EmptyState
            title="No Events Yet"
            description="Create your first event to get started."
            image="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1757585351/expense_dypnis.svg"
          />
        </div>
      )}

      <EventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </section>
  );
}
