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

const columns = (onEdit: (evt: EventItem) => void): ColumnDef<EventItem>[] => [
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
        <div className="flex items-center gap-10">
          <Button variant="link" className="p-0" onClick={() => onEdit(evt)}>
            <FaEdit /> Edit
          </Button>
          <DeleteButton itemId={evt.id} type="event" showText />
          {evt.isEpic ? <DownloadRegistrationsButton eventId={evt.id} /> : null}
        </div>
      );
    },
  },
];

export default function EventsTable({ data }: { data: EventItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);

  const onEdit = (evt: EventItem) => {
    setEditing(evt);
    setIsOpen(true);
  };
  const onClose = () => {
    setIsOpen(false);
    setEditing(null);
  };

  return (
    <section className="w-full">
      <DataTable columns={columns(onEdit)} data={data} />
      <EventModal
        isOpen={isOpen}
        onClose={onClose}
        isEditing={!!editing}
        id={editing?.id}
        initial={
          editing
            ? {
                title: editing.title,
                locationId: editing.locationId,
                startsAt: editing.startsAt,
                endsAt: editing.endsAt ?? undefined,
                isEpic: editing.isEpic,
                status: editing.status,
              }
            : undefined
        }
      />
    </section>
  );
}
