"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";

import { GXButton } from "@/components/ui/gx-button";
import { ConsentModal } from "@/components/modal/consent-modal";
import { useAppContext } from "@/server/provider/app-provider";
import { MatchdayLayout } from "@/components/layout/matchday-layout";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateMutation } from "@/hooks/use-create-mutation";

// --- Types + fetch for event details ---
type EventWithLocation = {
  id: string;
  locationId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isEpic: boolean;
  status: "draft" | "published" | "archived";
  city?: string | null;
  venue?: string | null;
  description?: string;
};

async function fetchEventWithLocation(
  eventId: string
): Promise<EventWithLocation> {
  const res = await fetch(`/api/events/${eventId}`);
  if (!res.ok) {
    throw new Error("Failed to load event");
  }

  const json: { ok: boolean; item?: EventWithLocation; error?: string } =
    await res.json();

  if (!json.ok || !json.item) {
    throw new Error(json.error || "Event not found");
  }

  return json.item;
}

// --- Zod schema for the registration form ---
const RegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

type RegistrationValues = z.infer<typeof RegistrationSchema>;

export default function RegistrationPage() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");
  const router = useRouter();

  const { consent, consentLoaded } = useAppContext();
  const hasConsent = consent.ageGatePassed && consent.acceptedTerms;

  // Separate state for notices (not part of RHF/zod)
  const [imageRightsAccepted, setImageRightsAccepted] = useState(false);
  const [dataPrivacyAccepted, setDataPrivacyAccepted] = useState(false);
  const [noticesError, setNoticesError] = useState<string | null>(null);

  const [showConsent, setShowConsent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Form setup ---
  const form = useForm<RegistrationValues>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const handleRegistration = useCreateMutation({
    endpoint: `/events/${eventId}/register`,
    successMessage: "Registration successful!",
    refetchKey: "registrations",
    onSuccess: () => {
      router.push(`/register/success?eventId=${eventId}`);
    },
  });

  // Load event details (for the mobile event card)
  const {
    data: event,
    isLoading: isEventLoading,
    isError: isEventError,
    error: eventError,
  } = useQuery({
    queryKey: ["event-registration", eventId],
    queryFn: () => fetchEventWithLocation(eventId as string),
    enabled: !!eventId,
  });

  const friendlyEventError =
    isEventError && eventError instanceof Error
      ? eventError.message
      : isEventError
      ? "Failed to load event details."
      : null;

  // On first client render, if consent is missing, open the consent modal
  useEffect(() => {
    if (!consentLoaded) return;
    if (!hasConsent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowConsent(true);
    }
  }, [consentLoaded, hasConsent]);

  if (!consentLoaded) {
    // Avoid hydration mismatch: render nothing until context is ready
    return null;
  }

  const handleConsentComplete = () => {
    setShowConsent(false);
  };

  if (!eventId) {
    return (
      <MatchdayLayout>
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-red-400">
            Missing <code>eventId</code>. Please use a valid registration link.
          </p>
        </div>
      </MatchdayLayout>
    );
  }

  const onSubmit = async (values: RegistrationValues) => {
    // Check notices first
    if (!imageRightsAccepted || !dataPrivacyAccepted) {
      setNoticesError(
        "You must accept both Image Rights and Data Privacy to continue."
      );
      return;
    }

    setNoticesError(null);

    const payload = {
      ...values,
      acceptedMarketing: imageRightsAccepted,
      ageGatePassed: consent.ageGatePassed,
      acceptedTerms: consent.acceptedTerms,
      source: "online",
    };

    await handleRegistration(payload, setSubmitError, form.reset);
  };

  // Format event date label for the card
  const dateLabel = event
    ? (() => {
        const startsDate = new Date(event.startsAt);
        if (isNaN(startsDate.getTime())) return event.startsAt;
        return startsDate.toLocaleString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
      })()
    : "";

  const isEpic = event?.isEpic ?? false;

  return (
    <MatchdayLayout>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* LEFT: mobile event card + registration form */}
        <section className="space-y-4">
          {/* Mobile-only event info card */}
          <div className="md:hidden">
            {isEventLoading && (
              <p className="text-xs text-neutral-400 mb-2">
                Loading event details…
              </p>
            )}

            {friendlyEventError && (
              <div className="mb-4 bg-red-950/40 border border-red-500/40 rounded-2xl p-3">
                <p className="text-xs text-red-300">{friendlyEventError}</p>
              </div>
            )}

            {event && !friendlyEventError && (
              <div className="mb-4 bg-neutral-950/60 border border-neutral-800 rounded-3xl p-4 space-y-2">
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-neutral-400">
                  Event details
                </p>
                <p className="text-sm font-semibold text-neutral-100">
                  {event.title}
                </p>
                <p className="text-xs text-neutral-300">
                  {event.city}
                  {event.venue ? ` · ${event.venue}` : ""}
                  <br />
                  {dateLabel}
                </p>
                <p className="text-[0.7rem] text-neutral-400 mt-1">
                  {isEpic
                    ? "EPIC Match Day – registration required to secure your place."
                    : "Regular Match Day – walk-ins welcome, but registration helps us plan your experience."}
                </p>
              </div>
            )}
          </div>

          {/* Registration form */}
          <section className="bg-neutral-950/60 border border-neutral-800 rounded-3xl p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-300">
                Event Registration
              </h2>
              <p className="text-xs">
                Please fill in your details below to secure your spot at the
                event.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-neutral-300">
                        Full name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          className="bg-black border-neutral-800 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[0.7rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-neutral-300">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="bg-black border-neutral-800 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[0.7rem]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-neutral-300">
                        Phone number (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+234..."
                          className="bg-black border-neutral-800 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[0.7rem]" />
                    </FormItem>
                  )}
                />

                <div className="border-t border-neutral-800 pt-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-300">
                    Event notices
                  </h3>

                  {/* Image Rights */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={imageRightsAccepted}
                      onCheckedChange={(checked) =>
                        setImageRightsAccepted(Boolean(checked))
                      }
                      className="mt-0.5 border-neutral-600 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-200">Image Rights</p>
                      <p className="text-[0.7rem] text-neutral-400">
                        By taking part in this event, you grant the event
                        organizers full right to use images and video taken of
                        you for public purposes, including printed and online
                        publicity, social media, and press releases.
                      </p>
                    </div>
                  </div>

                  {/* Data Privacy */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={dataPrivacyAccepted}
                      onCheckedChange={(checked) =>
                        setDataPrivacyAccepted(Boolean(checked))
                      }
                      className="mt-0.5 border-neutral-600 data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400"
                    />
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-200">Data Privacy</p>
                      <p className="text-[0.7rem] text-neutral-400">
                        We will process your personal data to reserve your place
                        at the event and provide you with event updates, in line
                        with our privacy policy.
                      </p>
                    </div>
                  </div>

                  {noticesError && (
                    <p className="text-[0.7rem] text-red-400 mt-1">
                      {noticesError}
                    </p>
                  )}
                </div>

                {submitError && (
                  <p className="text-sm text-red-400">{submitError}</p>
                )}

                <div className="pt-2">
                  <GXButton
                    type="submit"
                    variant="primary"
                    className="tracking-[0.22em] w-full md:w-auto"
                  >
                    Submit registration
                  </GXButton>
                </div>
              </form>
            </Form>
          </section>
        </section>

        {/* RIGHT: Banner (desktop only) */}
        <aside className="hidden md:block bg-neutral-950/60 p-0 overflow-hidden">
          <div className="relative w-full h-full min-h-[630px] flex items-center justify-center">
            <Image
              src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763038071/Matchday_KV44_r60zv2.webp"
              alt="Guinness Match Day"
              fill
              className="object-contain"
            />
          </div>
        </aside>
      </div>

      {/* Consent gate – blocking on this page */}
      {!hasConsent && (
        <ConsentModal
          open={showConsent}
          onOpenChange={setShowConsent}
          onComplete={handleConsentComplete}
          showCloseButton={false}
          dismissible={false}
        />
      )}
    </MatchdayLayout>
  );
}
