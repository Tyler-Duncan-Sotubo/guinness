// data/sidebar.data.tsx
import React, { JSX } from "react";
import { FaGift, FaFileAlt } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

type BaseItem = {
  title: string;
  name?: string;
  link?: string;
  icon?: JSX.Element;
  subItems?: readonly MenuItem[];
};

type DividerItem = {
  title: string;
  name?: string;
  type: "divider";
  link?: undefined;
  icon?: undefined;
  subItems?: undefined;
};

export type MenuItem = BaseItem | DividerItem;

export const main: readonly MenuItem[] = [
  {
    title: "Dashboard",
    icon: <MdDashboard size={20} />,
    link: "/dashboard",
  },
  {
    title: "Locations",
    icon: <FaGift size={20} />,
    link: "/dashboard/locations",
  },
  {
    title: "Events",
    icon: <FaFileAlt size={20} />,
    link: "/dashboard/events",
  },
] as const;
