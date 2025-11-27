// data/sidebar.data.tsx
import React, { JSX } from "react";
import { LayoutDashboard, MapPin, CalendarDays, Table } from "lucide-react";

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
    icon: <LayoutDashboard size={20} />,
    link: "/dashboard",
  },
  {
    title: "Locations",
    icon: <MapPin size={20} />,
    link: "/dashboard/locations",
  },
  {
    title: "Events",
    icon: <CalendarDays size={20} />,
    link: "/dashboard/events",
  },
  {
    title: "Matches",
    icon: <Table size={20} />,
    link: "/dashboard/matches",
  },
] as const;
