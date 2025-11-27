"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ChevronUpDown } from "@/components/ui/chevron-up-down";
import { DeleteButton } from "@/components/ui/delete-button";
import EventModal from "@/components/modal/event-modal";
import type { EventItem } from "@/types/events";
import { FaEdit } from "react-icons/fa";
import DownloadRegistrationsButton from "../ui/download-reg-button";
import { format } from "date-fns";
import MatchModal, { MatchFormValues } from "../modal/matches-modal";
import { IoFootballOutline } from "react-icons/io5";

const columns = (
  onEditEvent: (evt: EventItem) => void,
  onAddMatch: (evt: EventItem) => void
): ColumnDef<EventItem>[] => [
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        City <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[260px]">
        {row.getValue<string>("city")}
      </div>
    ),
  },
  {
    accessorKey: "venue",
    header: "Venue",
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[260px]">
        {row.getValue<string>("title")}
      </div>
    ),
  },
  {
    accessorKey: "startsAt",
    header: "Starts",
    cell: ({ row }) =>
      format(new Date(row.getValue<string>("startsAt")), "d 'of' LLLL"),
  },
  {
    accessorKey: "endsAt",
    header: "Ends",
    cell: ({ row }) =>
      row.getValue<string | null>("endsAt")
        ? format(new Date(row.getValue<string>("endsAt")!), "d 'of' LLLL")
        : "-",
  },
  {
    accessorKey: "isEpic",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => (row.getValue<boolean>("isEpic") ? "Epic" : "Regular"),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const evt = row.original;

      return (
        <div className="flex flex-wrap items-center gap-4">
          {/* Edit event */}
          <Button
            variant="link"
            className="p-0"
            onClick={() => onEditEvent(evt)}
          >
            <FaEdit /> Edit
          </Button>

          {/* Delete event */}
          <DeleteButton itemId={evt.id} type="event" showText />

          {/* Download registrations (Epic only) */}
          {evt.isEpic ? <DownloadRegistrationsButton eventId={evt.id} /> : null}
        </div>
      );
    },
  },
  {
    id: "add-match",
    header: "Add Match",
    cell: ({ row }) => {
      const evt = row.original;

      return (
        <Button variant="link" onClick={() => onAddMatch(evt)}>
          <IoFootballOutline />
        </Button>
      );
    },
  },
];

export default function EventsTable({ data }: { data: EventItem[] }) {
  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Match modal state
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [matchInitial, setMatchInitial] = useState<
    (Partial<MatchFormValues> & { id?: string }) | null
  >(null);

  const onEditEvent = (evt: EventItem) => {
    setEditingEvent(evt);
    setIsEventModalOpen(true);
  };

  const onCloseEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEvent(null);
  };

  const onAddMatch = (evt: EventItem) => {
    // Pre-fill eventId for this match (MatchModal uses it via hidden field)
    setMatchInitial({
      eventId: evt.id,
    });
    setIsMatchModalOpen(true);
  };

  const onCloseMatchModal = () => {
    setIsMatchModalOpen(false);
    setMatchInitial(null);
  };

  return (
    <section className="w-full">
      <DataTable columns={columns(onEditEvent, onAddMatch)} data={data} />

      {/* Event modal (add/edit event) */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={onCloseEventModal}
        isEditing={!!editingEvent}
        id={editingEvent?.id}
        initial={
          editingEvent
            ? {
                title: editingEvent.title,
                locationId: editingEvent.locationId,
                startsAt: editingEvent.startsAt,
                endsAt: editingEvent.endsAt ?? undefined,
                isEpic: editingEvent.isEpic,
                status: editingEvent.status,
              }
            : undefined
        }
      />

      {/* Match modal (add match for selected event) */}
      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={onCloseMatchModal}
        isEditing={false}
        // no id on create
        initial={matchInitial ?? undefined}
      />
    </section>
  );
}
