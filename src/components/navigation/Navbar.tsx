"use client";

import React, { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, LogOut, Menu, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { Input } from "../ui/input";
import ApplicationLogo from "../ui/application-logo";
import { main } from "@/assets/data/sidebar.data";
import ProfileSettings from "./ProfileSettings";

const NAV_H = 64; // px

type NavbarProps = {
  desktopLeftPx: number;
};

const Navbar: React.FC<NavbarProps> = ({ desktopLeftPx }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: number]: boolean }>(
    {}
  );

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const desktopStyle = useMemo<React.CSSProperties>(
    () => ({
      left: desktopLeftPx,
      right: 0,
      height: NAV_H,
      transition: "left 200ms ease, right 200ms ease",
    }),
    [desktopLeftPx]
  );

  return (
    <div
      className=" sticky top-0 z-40 bg-white border-b border-black/5"
      style={{ height: NAV_H }}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-4">
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Menu size={28} className="text-brand cursor-pointer" />
            </SheetTrigger>
            <SheetContent className="w-full bg-white">
              <ApplicationLogo
                className="h-20 w-32"
                src="/logo.png"
                alt="Logo"
                link="/dashboard"
                close={() => setIsOpen(false)}
              />

              <nav className="mt-6 space-y-6">
                <ul>
                  {main.map((item, index) => {
                    const isActive =
                      item.link === "/dashboard"
                        ? pathname === "/dashboard"
                        : item.link && pathname.startsWith(item.link);

                    return (
                      <li key={index} className="mb-3">
                        <Link
                          href={item.link ?? "#"}
                          onClick={() =>
                            item.subItems
                              ? setOpenSubmenus((prev) => ({
                                  ...prev,
                                  [index]: !prev[index],
                                }))
                              : (() => {
                                  setOpenSubmenus({});
                                  setIsOpen(false);
                                })()
                          }
                          className={`flex w-full items-center justify-between py-3 px-4 transition-colors duration-300 ${
                            isActive
                              ? "font-bold text-textPrimary"
                              : "hover:bg-black/5"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-md font-bold ${
                                isActive ? "text-textPrimary" : ""
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          {item.subItems && (
                            <ChevronDown
                              size={20}
                              className={`transform transition-transform ${
                                openSubmenus[index] ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </Link>

                        {item.subItems && openSubmenus[index] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-8 space-y-2 overflow-hidden"
                            onClick={() => setIsOpen(false)}
                          >
                            {item.subItems.map((sub) => (
                              <Link
                                key={sub.link}
                                href={sub.link ?? "#"}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-2 py-2 px-6 text-md transition-colors duration-300 ${
                                  pathname === sub.link
                                    ? "bg-white font-bold text-textPrimary"
                                    : "hover:bg-black/5"
                                }`}
                              >
                                {sub.title}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </li>
                    );
                  })}

                  <button
                    className="mt-6 flex w-full items-center gap-4 px-4 py-3 font-semibold text-textPrimary hover:text-red-500"
                    onClick={() => handleLogout()}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Nav Links Centered */}
        <nav
          className="hidden md:flex justify-between gap-5 w-full px-4 items-center"
          style={desktopStyle}
        >
          <Input
            type="search"
            placeholder="Search..."
            className="w-full h-10 max-w-[400px] bg-sidebar text-textPrimary placeholder:text-textSecondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-opacity-50 border-none"
            leftIcon={<Search size={20} className="text-textSecondary" />}
          />
          <ProfileSettings />
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
