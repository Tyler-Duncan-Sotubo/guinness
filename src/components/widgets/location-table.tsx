"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { ChevronUpDown } from "../ui/chevron-up-down";
import { Location } from "@/types/locations";
import { DeleteButton } from "../ui/delete-button";
import LocationModal from "../modal/location-modal";
import { DataTable } from "../ui/data-table";
import { useState } from "react";
import { FaEdit } from "react-icons/fa";

const locationColumns = (
  onEdit: (loc: Location) => void
): ColumnDef<Location>[] => [
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        City
        <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const city = row.getValue<string>("city");
      return (
        <div className="truncate max-w-[200px]" title={city}>
          {city}
        </div>
      );
    },
  },
  {
    accessorKey: "venue",
    header: "Venue",
    cell: ({ row }) => {
      const venue = row.getValue<string | null>("venue") ?? "-";
      return (
        <span className="truncate max-w-60" title={venue || ""}>
          {venue || "-"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const loc = row.original;
      return (
        <div className="flex items-center gap-6">
          <Button variant="link" className="p-0" onClick={() => onEdit(loc)}>
            <FaEdit /> Edit
          </Button>

          <DeleteButton itemId={loc.id} type="location" showText={true} />
        </div>
      );
    },
  },
];

export default function LocationsTable({ data }: { data: Location[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);

  const onEdit = (loc: Location) => {
    setEditing(loc);
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
    setEditing(null);
  };

  return (
    <section className="w-full">
      <DataTable columns={locationColumns(onEdit)} data={data} />

      {/* Single modal controlled by state */}
      <LocationModal
        isOpen={isOpen}
        isEditing={true}
        id={editing?.id}
        city={editing?.city ?? ""}
        venue={editing?.venue ?? null}
        onClose={onClose} // make sure LocationModal calls this
      />
    </section>
  );
}
