"use client";

import React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "w-full shadow-2xl border-border/60 py-6 text-center text-md text-muted-foreground",
        className
      )}
    >
      <div className="container flex flex-col items-center justify-center gap-1">
        <p className="flex items-center gap-1.5 text-base sm:text-md">
          Made with{" "}
          <Heart className="h-4 w-4 text-red-500 fill-red-500 inline-block" />{" "}
          by <span className="font-medium text-foreground">Centa</span>
        </p>

        <p>
          © {new Date().getFullYear()} · a{" "}
          <span className="font-medium">tooXclusive Digital</span> company
        </p>
      </div>
    </footer>
  );
}
