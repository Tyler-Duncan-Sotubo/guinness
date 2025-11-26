"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GXButton } from "@/components/ui/gx-button";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import type { EventItem } from "@/types/events";

type SelectCityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (event: EventItem) => void;
  showEpic?: boolean;
  showRegular?: boolean;
};

async function fetchEvents(): Promise<EventItem[]> {
  const eventsRes = await fetch("/api/events");
  if (!eventsRes.ok) throw new Error("Failed to load events");

  const eventsJson: { items?: EventItem[] } = await eventsRes.json();
  const items = eventsJson.items ?? [];

  return items.filter((e) => e.status === "published");
}

export function SelectCityModal({
  open,
  onOpenChange,
  onSelect,
  showEpic = true,
  showRegular = true,
}: SelectCityModalProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const {
    data: events,
    isLoading,
    isError,
    error,
  } = useQuery<EventItem[]>({
    queryKey: ["events-with-locations"],
    queryFn: fetchEvents,
    enabled: open,
  });

  const { eventsByCity, cityOrder } = useMemo(() => {
    const byCity: Record<string, EventItem[]> = {};
    const items = events ?? [];

    // 🔍 Filter by epic / regular based on props
    const filtered = items.filter((ev) => {
      if (showEpic && showRegular) return true;
      if (showEpic && !showRegular) return ev.isEpic;
      if (!showEpic && showRegular) return !ev.isEpic;
      // if both false, show nothing:
      return false;
    });

    for (const ev of filtered) {
      const key = ev.city || "Other";
      if (!byCity[key]) byCity[key] = [];
      byCity[key].push(ev);
    }

    // Sort within each city (by date then title)
    Object.keys(byCity).forEach((city) => {
      byCity[city].sort((a, b) => {
        if (a.startsAt < b.startsAt) return -1;
        if (a.startsAt > b.startsAt) return 1;
        return a.title.localeCompare(b.title);
      });
    });

    const cities = Object.keys(byCity).sort((a, b) => a.localeCompare(b));
    return { eventsByCity: byCity, cityOrder: cities };
  }, [events, showEpic, showRegular]);

  useEffect(() => {
    if (!selectedCity && cityOrder.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCity(cityOrder[0]);
    }
  }, [cityOrder, selectedCity]);

  const handleSelect = (event: EventItem) => {
    onSelect(event);
    onOpenChange(false);
  };

  const eventsForSelectedCity =
    (selectedCity && eventsByCity[selectedCity]) || [];

  const friendlyError =
    isError && error instanceof Error
      ? error.message
      : isError
      ? "Failed to load events. Please try again."
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-black text-white border border-neutral-800">
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763471645/Matchday-Logo_jnj6hl.webp"
            alt="Guinness Matchday"
            fill
            className="object-contain object-center"
            priority
          />
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-tight uppercase">
            {showEpic
              ? "Select Your EPIC City & Match Day"
              : "Select Your City & Match Day"}
          </DialogTitle>

          <DialogDescription className="text-sm text-neutral-300">
            {showEpic
              ? "Choose your eligible EPIC city, then pick the exclusive Match Day event you want to attend."
              : "Start by choosing your city, then pick the Match Day event you want to attend."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {isLoading && (
            <p className="text-xs text-neutral-400">Loading events…</p>
          )}

          {friendlyError && (
            <p className="text-xs text-red-400">
              {friendlyError} If this keeps happening, please refresh the page.
            </p>
          )}

          {!isLoading && !friendlyError && cityOrder.length === 0 && (
            <p className="text-xs text-neutral-400">
              No events are currently available. Please check back later.
            </p>
          )}

          {!isLoading && !friendlyError && cityOrder.length > 0 && (
            <>
              {/* Cities row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {cityOrder.map((city) => (
                  <GXButton
                    key={city}
                    type="button"
                    variant={city === selectedCity ? "primary" : "secondary"}
                    className="px-4 py-2 text-[0.65rem] font-bold"
                    onClick={() => setSelectedCity(city)}
                  >
                    {city}
                  </GXButton>
                ))}
              </div>

              {/* Events for selected city */}
              {selectedCity && eventsForSelectedCity.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 max-h-88 overflow-y-auto pr-1">
                  {eventsForSelectedCity.map((event) => {
                    const startsDate = new Date(event.startsAt);
                    const dateLabel = isNaN(startsDate.getTime())
                      ? event.startsAt
                      : startsDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        });

                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleSelect(event)}
                        className="text-left rounded-2xl border cursor-pointer border-neutral-800 bg-neutral-950/60 hover:border-amber-400 hover:bg-neutral-900/80 transition-colors p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-neutral-50">
                            {event.title}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
                              event.isEpic
                                ? "bg-amber-400 text-black"
                                : "bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            {event.isEpic ? "Epic" : "Regular"}
                          </span>
                        </div>

                        <div className="text-[0.7rem] text-white space-y-1 font-bold">
                          <p>
                            {dateLabel}
                            {event.venue ? ` · ${event.venue}` : null}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : selectedCity ? (
                <p className="text-xs text-neutral-400">
                  No events available for {selectedCity}.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-neutral-900 flex justify-end">
          <GXButton
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Close
          </GXButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
