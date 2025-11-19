"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FaDownload } from "react-icons/fa6";

interface Props {
  eventId: string;
}

export default function DownloadRegistrationsButton({ eventId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (format: "csv" | "excel") => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/registrations-dl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error || "No registrations available");
        setLoading(false);
        return;
      }

      // Trigger S3 file download
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Error exporting file", {
        description: "No registrations available",
      });
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading} variant="outline">
          {loading ? "..." : <FaDownload />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload("csv")}>
          Download as CSV
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleDownload("excel")}>
          Download as Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
