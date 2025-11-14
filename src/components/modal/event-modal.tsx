"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { useQuery } from "@tanstack/react-query";
import { api, isAxiosError } from "@/lib/axios";
import { useCreateMutation } from "@/hooks/use-create-mutation";
import { useUpdateMutation } from "@/hooks/use-update-mutation";
import FormError from "@/components/ui/form-error";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// date-fns
import { parse, parseISO, isValid, formatISO, format } from "date-fns";

/* ---------------------------------------
   Schema (strings for dates; endsAt optional)
---------------------------------------- */
const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    locationId: z.string().uuid("Select a location"),
    startsAt: z.string().min(1, "Start time is required"), // "yyyy-MM-dd'T'HH:mm"
    endsAt: z.string().optional(), // optional
    isEpic: z.boolean().default(true),
    status: z.enum(["draft", "published", "archived"]).default("published"),
  })
  .refine(
    (v) => {
      // validate dates if present
      const s = toISOFromLocal(v.startsAt);
      if (!s) return false;
      if (!v.endsAt) return true;
      const e = toISOFromLocal(v.endsAt);
      if (!e) return false;
      return new Date(e).getTime() >= new Date(s).getTime();
    },
    { path: ["endsAt"], message: "End must be after start" }
  );

// Use input type so optional/defaulted fields align with resolver
export type EventFormValues = z.input<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isEditing?: boolean;
  id?: string;
  // initial values when editing (ISO strings for dates)
  initial?: Partial<EventFormValues> & { id?: string };
};

export default function EventModal({
  isOpen,
  onClose,
  isEditing = false,
  id,
  initial,
}: Props) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      locationId: "",
      startsAt: "",
      endsAt: "",
      isEpic: true,
      status: "published",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      title: initial?.title ?? "",
      locationId: initial?.locationId ?? "",
      // Convert ISO -> "yyyy-MM-dd'T'HH:mm" for input
      startsAt: initial?.startsAt ? toLocalDateTime(initial.startsAt) : "",
      endsAt: initial?.endsAt ? toLocalDateTime(initial.endsAt) : "",
      isEpic: initial?.isEpic ?? true,
      status: initial?.status ?? "published",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id, isEditing]);

  // locations for select
  const { data: locations = [] } = useQuery({
    queryKey: ["locations:forSelect"],
    queryFn: async () => {
      const res = await api.get("/locations");
      return (res.data.items ?? []) as {
        id: string;
        city: string;
        venue: string | null;
      }[];
    },
  });

  const createEvent = useCreateMutation<EventFormValues>({
    endpoint: `/events`,
    successMessage: "Event created successfully",
    refetchKey: "events",
  });

  const updateEvent = useUpdateMutation<EventFormValues>({
    endpoint: `/events/${id}`,
    successMessage: "Event updated successfully",
    refetchKey: "events",
  });

  const onSubmit = async (values: EventFormValues) => {
    setError(null);

    const startsISO = toISOFromLocal(values.startsAt);
    const endsISO = values.endsAt ? toISOFromLocal(values.endsAt) : undefined;

    if (!startsISO) {
      setError("Invalid start date/time");
      return;
    }
    if (values.endsAt && !endsISO) {
      setError("Invalid end date/time");
      return;
    }

    const dto = {
      ...values,
      startsAt: startsISO, // store as ISO string (DB TEXT)
      endsAt: endsISO, // may be undefined if omitted
    };

    try {
      if (isEditing && id) {
        await updateEvent(dto, setError, onClose);
      } else {
        await createEvent(dto, setError, onClose);
      }
    } catch (e) {
      if (isAxiosError(e))
        setError(e.response?.data?.error ?? "Failed to save event.");
      else setError("Failed to save event.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Event" : "Add Event"}
      confirmText={isEditing ? "Update" : "Add"}
      onConfirm={form.handleSubmit(onSubmit)}
      isLoading={form.formState.isSubmitting}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 my-6">
          {/* Title */}
          <FormField
            name="title"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Guinness Match Day - Owerri" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            name="locationId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Location</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.city}
                          {l.venue ? ` — ${l.venue}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Starts at */}
          <FormField
            name="startsAt"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Starts at</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ends at (optional) */}
          <FormField
            name="endsAt"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ends at (optional)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Toggles */}
          <div className="flex items-center gap-4">
            <FormField
              name="isEpic"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>Epic</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="status"
              control={form.control}
              render={({ field }) => (
                <FormItem className="w-44">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

      {error && <FormError message={error} />}
    </Modal>
  );
}

/* ---------------------------
   Helpers (date-fns based)
---------------------------- */

// Convert "yyyy-MM-dd'T'HH:mm" (from <input type="datetime-local" />) to ISO string
function toISOFromLocal(datetimeLocal?: string): string | undefined {
  if (!datetimeLocal) return undefined;
  // Parse as local time using the exact pattern
  const parsed = parse(datetimeLocal, "yyyy-MM-dd'T'HH:mm", new Date());
  if (!isValid(parsed)) return undefined;
  return formatISO(parsed); // e.g. "2025-11-12T12:00:00Z"
}

// Convert ISO string -> "yyyy-MM-dd'T'HH:mm" for the input value
function toLocalDateTime(iso: string) {
  const d = parseISO(iso);
  if (!isValid(d)) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
