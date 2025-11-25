"use client";

import { useState } from "react";
import Image from "next/image";
import Sidebar from "@/components/navigation/Sidebar";
import Navbar from "@/components/navigation/Navbar";
import ScrollToTop from "@/components/navigation/ScrollToTop";

const SIDEBAR_EXPANDED_W = 240;
const SIDEBAR_COLLAPSED_W = 64;

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-x-hidden flex">
      {/* Sidebar */}
      <div
        className={`hidden md:block shrink-0 ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
      </div>

      {/* Main column */}
      <div className="relative flex-1 min-w-0 bg-white/80">
        <Navbar
          desktopLeftPx={
            sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W
          }
        />

        <main className="relative pt-2 md:pt-8 py-4 min-h-[81vh]">
          <ScrollToTop />

          {/* 🔥 LOGO ONLY BEHIND MAIN CONTENT */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] opacity-5">
              <Image
                src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763471645/Matchday-Logo_jnj6hl.webp"
                alt="Guinness Matchday"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Content above the logo */}
          <div className="relative z-10 min-w-0 pt-4 pb-10">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
