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

type EventItem = {
  id: string;
  locationId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isEpic: boolean;
  status: "draft" | "published" | "archived";
};

type LocationItem = {
  id: string;
  city: string;
  venue: string | null;
};

type DisplayEvent = EventItem & {
  city: string;
  venue: string | null;
};

type SelectCityModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (event: DisplayEvent) => void;
};

async function fetchEventsWithLocations(): Promise<DisplayEvent[]> {
  const [eventsRes, locationsRes] = await Promise.all([
    fetch("/api/events"),
    fetch("/api/locations"),
  ]);

  if (!eventsRes.ok) throw new Error("Failed to load events");
  if (!locationsRes.ok) throw new Error("Failed to load locations");

  const eventsJson: { items: EventItem[] } = await eventsRes.json();
  const locationsJson: { items: LocationItem[] } = await locationsRes.json();

  const locationMap = new Map<string, LocationItem>();
  for (const loc of locationsJson.items) {
    locationMap.set(loc.id, loc);
  }

  const published = eventsJson.items.filter((e) => e.status === "published");

  const withLocation: DisplayEvent[] = published.map((e) => {
    const loc = locationMap.get(e.locationId);
    return {
      ...e,
      city: loc?.city ?? "Unknown city",
      venue: loc?.venue ?? null,
    };
  });

  return withLocation;
}

export function SelectCityModal({
  open,
  onOpenChange,
  onSelect,
}: SelectCityModalProps) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const {
    data: events,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["events-with-locations"],
    queryFn: fetchEventsWithLocations,
    enabled: open, // only fetch when modal is open
  });

  const { eventsByCity, cityOrder } = useMemo(() => {
    const byCity: Record<string, DisplayEvent[]> = {};
    const items = events ?? [];

    for (const ev of items) {
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
  }, [events]);

  // Ensure selectedCity is set when data loads / changes
  useEffect(() => {
    if (!selectedCity && cityOrder.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCity(cityOrder[0]);
    }
  }, [cityOrder, selectedCity]);

  const handleSelect = (event: DisplayEvent) => {
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
      <DialogContent className="max-w-md bg-black text-white border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-tight uppercase">
            Select your city &amp; match day
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-300">
            Start by choosing your city, then pick the Match Day event you want
            to attend.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Loading */}
          {isLoading && (
            <p className="text-xs text-neutral-400">Loading events…</p>
          )}

          {/* Error */}
          {friendlyError && (
            <p className="text-xs text-red-400">
              {friendlyError} If this keeps happening, please refresh the page.
            </p>
          )}

          {/* Empty state */}
          {!isLoading && !friendlyError && cityOrder.length === 0 && (
            <p className="text-xs text-neutral-400">
              No events are currently available. Please check back later.
            </p>
          )}

          {/* Content */}
          {!isLoading && !friendlyError && cityOrder.length > 0 && (
            <>
              {/* Cities row */}
              <div className="flex flex-wrap gap-2 mb-3">
                {cityOrder.map((city) => (
                  <GXButton
                    key={city}
                    type="button"
                    variant={city === selectedCity ? "primary" : "secondary"}
                    className="px-4 py-2 text-[0.65rem]"
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

                        <div className="text-[0.7rem] text-neutral-400 space-y-1">
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
