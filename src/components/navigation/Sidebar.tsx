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

const SIDEBAR_EXPANDED_W = 240;
const SIDEBAR_COLLAPSED_W = 64;

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const normalize = (p?: string) =>
    (p ?? "").split("?")[0].replace(/\/+$/g, "") || "/";

  const isActive = (href?: string, includeSubpaths = false) => {
    if (!href) return false;
    const a = normalize(pathname);
    const b = normalize(href);
    return includeSubpaths ? a === b || a.startsWith(b + "/") : a === b;
  };

  return (
    <TooltipProvider>
      <motion.aside
        animate={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W,
        }}
        transition={{ duration: 0.2 }}
        className="
          md:fixed hidden left-0 top-0 h-screen 
          bg-black text-amber-100 border-r border-amber-500/30
          p-2 md:flex flex-col justify-between overflow-y-auto
        "
      >
        <div>
          {/* Logo */}
          <div className={`my-5 ${isCollapsed ? "px-1" : "px-3"}`}>
            <ApplicationLogo
              className={
                isCollapsed ? "h-12 w-10 flex justify-center" : "h-26 w-36"
              }
              src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763471645/Matchday-Logo_jnj6hl.webp"
              alt="Matchday Logo"
              link="/dashboard"
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {main.map((item) => (
              <div key={item.title}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.link || "#"}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded transition-colors 
                        ${
                          isActive(item.link)
                            ? "text-amber-400 bg-amber-500/10 font-semibold"
                            : "text-amber-100 hover:bg-amber-500/20"
                        }
                      `}
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
            className="p-2 rounded hover:bg-amber-500/20 text-amber-100"
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
