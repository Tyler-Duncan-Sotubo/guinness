"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CgProfile } from "react-icons/cg";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const ProfileSettings = () => {
  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("workspace");
      localStorage.removeItem("last_mgr");
      localStorage.removeItem("last_emp");
    }
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none ">
        <CgProfile size={40} color="black" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-6 mt-2 capitalize w-60 font-bold space-y-2 py-4">
        <DropdownMenuItem className="px-5 py-2">
          <Link href="" onClick={() => handleLogout()}>
            <div className="flex items-center gap-4">
              <LogOut size={25} className="text-monzo-primary" />
              <p className="text-md text-monzo-primary">Logout</p>
            </div>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileSettings;
