"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { api, isAxiosError } from "@/lib/axios";
import PageHeader from "@/components/ui/page-header";
import EmptyState from "@/components/ui/empty-state";
import LocationsTable from "@/components/widgets/location-table";
import { Location } from "@/types/locations";
import ErrorState from "@/components/ui/error-state";
import Loading from "@/components/ui/loading";
import LocationModal from "@/components/modal/location-modal";

export default function LocationsIndexPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const fetchLocations = async (): Promise<Location[]> => {
    try {
      const res = await api.get("/locations");
      console.log("Fetched locations:", res.data);
      return res.data.items ?? [];
    } catch (error) {
      if (isAxiosError(error) && error.response) return [];
      throw error;
    }
  };

  const {
    data: locations,
    isLoading,
    isError,
    refetch,
  } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: fetchLocations,
  });

  if (isLoading) return <Loading />;
  if (isError)
    return (
      <ErrorState
        message="Error fetching locations."
        onRetry={refetch}
        isLoading={isLoading}
      />
    );

  return (
    <section className="px-5">
      <PageHeader
        title="Locations"
        description="Cities/venues where events can be hosted."
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} />
          Add Location
        </Button>
      </PageHeader>

      {Array.isArray(locations) && locations.length > 0 ? (
        <LocationsTable data={locations} />
      ) : (
        <div className="mt-20">
          <EmptyState
            title="No Locations Yet"
            description="Create your first city/venue to start scheduling events."
            image="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1757585351/expense_dypnis.svg"
          />
        </div>
      )}

      {/* Create / Edit Location */}
      <LocationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </section>
  );
}
