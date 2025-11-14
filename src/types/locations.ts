// src/types/api/locations.ts
export type LocationDTO = {
  id: string;
  city: string;
  venue: string | null;
};

export type Location = {
  id: string;
  city: string;
  venue: string | null;
};

export type CreateLocationPayload = {
  city: string;
  venue?: string;
};

export type UpdateLocationPayload = Partial<CreateLocationPayload>;

export type ListLocationsResponse = { items: LocationDTO[] };
export type LocationResponse = { item: LocationDTO };
