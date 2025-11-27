"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ChevronUpDown } from "@/components/ui/chevron-up-down";
import { DeleteButton } from "@/components/ui/delete-button";
import { FaEdit } from "react-icons/fa";
import { format } from "date-fns";
import MatchModal, { MatchFormValues } from "../modal/matches-modal";
import { MatchItem } from "@/types/matches";

const columns = (
  onEditMatch: (match: MatchItem) => void
): ColumnDef<MatchItem>[] => [
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
      <div className="truncate max-w-40">
        {row.getValue<string | null>("city") ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "venue",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Venue <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[200px]">
        {row.getValue<string | null>("venue") ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "homeTeam",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Home <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => row.getValue<string>("homeTeam"),
  },
  {
    accessorKey: "awayTeam",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Away <ChevronUpDown />
      </Button>
    ),
    cell: ({ row }) => row.getValue<string>("awayTeam"),
  },
  {
    accessorKey: "kickoffAt",
    header: "Kickoff",
    cell: ({ row }) => {
      const iso = row.getValue<string>("kickoffAt");
      return format(new Date(iso), "dd MMM yyyy, HH:mm");
    },
  },
  {
    accessorKey: "externalFixtureId",
    header: "Fixture ID",
    cell: ({ row }) => (
      <div className="truncate max-w-40">
        {row.getValue<string>("externalFixtureId")}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const match = row.original;
      return (
        <div className="flex items-center gap-4">
          <Button
            variant="link"
            className="p-0"
            onClick={() => onEditMatch(match)}
          >
            <FaEdit /> Edit
          </Button>
          <DeleteButton itemId={match.id} type="match" showText />
        </div>
      );
    },
  },
];

type MatchesTableProps = {
  data: MatchItem[];
};

export default function MatchesTable({ data }: MatchesTableProps) {
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [matchInitial, setMatchInitial] = useState<
    (Partial<MatchFormValues> & { id?: string }) | null
  >(null);

  const onEditMatch = (match: MatchItem) => {
    setEditingMatch(match);
    setMatchInitial({
      eventId: match.eventId,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickoffAt: match.kickoffAt,
      externalFixtureId: match.externalFixtureId,
    });
    setIsMatchModalOpen(true);
  };

  const onCloseMatchModal = () => {
    setIsMatchModalOpen(false);
    setEditingMatch(null);
    setMatchInitial(null);
  };

  return (
    <section className="w-full space-y-4">
      <DataTable columns={columns(onEditMatch)} data={data} />

      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={onCloseMatchModal}
        isEditing={!!editingMatch}
        id={editingMatch?.id}
        initial={matchInitial ?? undefined}
      />
    </section>
  );
}
