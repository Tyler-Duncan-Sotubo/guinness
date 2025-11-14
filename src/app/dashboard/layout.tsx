// Layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import Navbar from "@/components/navigation/Navbar";
import ScrollToTop from "@/components/navigation/ScrollToTop";

const SIDEBAR_EXPANDED_W = 240; // px (w-64)
const SIDEBAR_COLLAPSED_W = 64; // px (w-16)

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-x-hidden w-">
      {/* Sidebar (desktop only) */}
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
      <div className="flex-1 min-w-0 bg-white">
        {/* Navbar now reacts to sidebarCollapsed and aligns itself (fixed at md+, sticky on mobile) */}
        <Navbar
          desktopLeftPx={
            sidebarCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W
          }
        />

        <main className="pt-2 md:pt-8 py-4">
          {/* pt-16 offsets fixed/sticky navbar height */}
          <ScrollToTop />
          <div className="min-w-0 transition-[width,max-width] duration-200 pt-4 pb-10 min-h-[81vh] ">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
