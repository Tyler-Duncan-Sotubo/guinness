"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  TbLayoutSidebarRightCollapseFilled,
  TbLayoutSidebarLeftCollapseFilled,
} from "react-icons/tb";
import ApplicationLogo from "../ui/application-logo";
import { main } from "@/assets/data/sidebar.data";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const SIDEBAR_EXPANDED_W = 240; // px
const SIDEBAR_COLLAPSED_W = 64; // px

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // ---- FIX: exact match by default, optional subpath support
  const normalize = (p?: string) =>
    (p ?? "").split("?")[0].replace(/\/+$/g, "") || "/";

  const isActive = (href?: string, includeSubpaths = false) => {
    if (!href) return false;
    const a = normalize(pathname);
    const b = normalize(href);
    return includeSubpaths ? a === b || a.startsWith(b + "/") : a === b;
  };
  // ----

  return (
    <TooltipProvider>
      <motion.aside
        animate={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
        }}
        transition={{ duration: 0.2 }}
        className="md:fixed hidden left-0 top-0 h-screen bg-monzo-background text-monzo-textPrimary border-r p-2 md:flex flex-col justify-between overflow-y-auto"
      >
        <div>
          {/* Logo */}
          <div className={`my-5 ${isCollapsed ? "px-1" : "px-3"}`}>
            <ApplicationLogo
              className={
                isCollapsed ? "h-10 w-8 flex justify-center" : "h-14 w-24"
              }
              src={
                isCollapsed
                  ? "https://res.cloudinary.com/dw1ltt9iz/image/upload/v1757584746/logo-icon_ig26ee.png"
                  : "https://res.cloudinary.com/dw1ltt9iz/image/upload/v1757584747/logo-white_zveolj.png"
              }
              alt="Company Logo"
              link="/dashboard"
            />
          </div>

          {/* Navigation (flat) */}
          <nav className="space-y-1">
            {main.map((item) => (
              <div key={item.title}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.link || "#"}
                      className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                        // exact by default; pass true to keep parent active on children
                        isActive(
                          item.link /*, item.keepActiveOnChildren === true */
                        )
                          ? "text-monzo-green font-semibold"
                          : "hover:bg-monzo-brand text-monzo-text-primary"
                      }`}
                    >
                      {item.icon}
                      {!isCollapsed && (
                        <span className="flex items-center justify-between w-full text-base">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  )}
                </Tooltip>
              </div>
            ))}
          </nav>
        </div>

        {/* Collapse Toggle */}
        <div className="flex justify-end px-2 pb-2">
          <button
            onClick={onToggle}
            className="p-2 rounded hover:bg-monzo-brand"
          >
            {isCollapsed ? (
              <TbLayoutSidebarRightCollapseFilled size={20} />
            ) : (
              <TbLayoutSidebarLeftCollapseFilled size={25} />
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
