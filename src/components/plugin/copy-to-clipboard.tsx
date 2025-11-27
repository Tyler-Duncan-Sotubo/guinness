"use client";

import React, { useMemo, useState } from "react";

type PredictAndWinLinkProps = {
  city: string;
  eventId: string;
};

const PredictAndWinLink: React.FC<PredictAndWinLinkProps> = ({
  city,
  eventId,
}) => {
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";

    const params = new URLSearchParams({ city, eventId }).toString();
    return `${base}/predict-and-win?${params}`;
  }, [city, eventId]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.className = "fixed left-[-9999px]";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <button
        onClick={handleCopy}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
          copied
            ? "bg-green-600 text-white"
            : "text-black border hover:bg-black hover:text-white dark:text-white dark:border-gray-600 dark:hover:bg-white dark:hover:text-black"
        }`}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
};

export default PredictAndWinLink;
