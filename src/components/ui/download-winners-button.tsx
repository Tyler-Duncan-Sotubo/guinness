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
  city: string;
}

export default function DownloadPredictionsButton({ eventId, city }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (format: "csv" | "excel") => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, city }),
      });

      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error || "No predictions available");
        setLoading(false);
        return;
      }

      // Trigger S3 file download
      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      toast.error("Error exporting predictions", {
        description: "No predictions available",
      });
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={loading} variant="link">
          {loading ? "..." : <FaDownload />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload("csv")}>
          Download predictions as CSV
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleDownload("excel")}>
          Download predictions as Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
