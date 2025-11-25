export type EventStatus = "draft" | "published" | "archived";

export interface EventItem {
  id: string;
  locationId: string;
  title: string;
  startsAt: string; // ISO string
  endsAt: string; // ISO string (now required)
  isEpic: boolean;
  status: EventStatus;
  city: string;
  venue: string | null;
}
