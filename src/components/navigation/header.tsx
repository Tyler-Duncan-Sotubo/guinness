"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="gap-4 px-4 md:px-60 my-8">
      <div className="flex items-center gap-3">
        {/* 
          RULES:
          - Home page → mobile only (flex md:hidden)
          - Other pages → always show (flex)
        */}
        <div
          className={
            isHome
              ? "flex md:hidden w-full justify-between"
              : "flex w-full justify-between"
          }
        >
          <Link href="/">
            <div className="relative h-16 w-16 md:h-20 md:w-20">
              <Image
                src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763051969/gameday-logo_e0fhw5.png"
                alt="Guinness Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          <Link href="/">
            <div className="relative h-16 w-28 md:h-20 md:w-32">
              <Image
                src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763044535/matchday-logo_tpx04h.png"
                alt="Matchday Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
