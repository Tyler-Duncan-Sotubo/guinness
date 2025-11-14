// components/LocationModal.tsx
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import FormError from "@/components/ui/form-error";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { isAxiosError } from "axios";
import { useUpdateMutation } from "@/hooks/use-update-mutation";
import { useCreateMutation } from "@/hooks/use-create-mutation";

/* ------------------------
   Schema + Types (city & venue only)
-------------------------*/
const locationSchema = z.object({
  city: z
    .string()
    .min(1, "City is required")
    .max(100)
    .transform((s) => s.trim()),
  venue: z.string().max(200, "Max 200 characters").optional(),
});

export type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;

  // mode
  isEditing?: boolean;
  id?: string;

  // initial values when editing
  city?: string | null;
  venue?: string | null;
}

export default function LocationModal({
  isOpen,
  onClose,
  isEditing = false,
  id,
  city,
  venue,
}: LocationModalProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      city: city ?? "",
      venue: venue ?? "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      city: city ?? "",
      venue: venue ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditing, id, city, venue]);

  // Create
  const createLocation = useCreateMutation<LocationFormValues>({
    endpoint: `/locations`,
    successMessage: "Location created successfully",
    refetchKey: "locations",
  });

  // Update
  const updateLocation = useUpdateMutation<LocationFormValues>({
    endpoint: `/locations/${id}`,
    successMessage: "Location updated successfully",
    refetchKey: "locations",
  });

  const onSubmit = async (values: LocationFormValues) => {
    setError(null);

    const dto = {
      city: values.city,
      venue: values.venue || undefined,
    };

    try {
      if (isEditing && id) {
        await updateLocation(dto, setError, onClose);
      } else {
        await createLocation(dto, setError, onClose);
      }
    } catch (e) {
      if (isAxiosError(e)) {
        setError(e.response?.data?.error ?? "Failed to save location.");
      } else {
        setError("Failed to save location.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Location" : "Add Location"}
      confirmText={isEditing ? "Update" : "Add"}
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={form.formState.isSubmitting}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-6">
          {/* City */}
          <FormField
            name="city"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>City</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Lagos" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Venue */}
          <FormField
            name="venue"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Eko Convention Centre" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {error && <FormError message={error} />}
    </Modal>
  );
}
