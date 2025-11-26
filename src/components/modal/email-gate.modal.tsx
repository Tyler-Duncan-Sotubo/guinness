/* eslint-disable react-hooks/set-state-in-effect */
// components/modal/email-gate-modal.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GXButton } from "@/components/ui/gx-button";

import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type EmailGateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (email: string) => void;
  city?: string | null;
  dismissible?: boolean;
  showCloseButton?: boolean;
  registerHref?: string; // Where to send user if email NOT found
};

type EmailGateFormValues = {
  email: string;
};

export function EmailGateModal({
  open,
  onOpenChange,
  onComplete,
  city,
  dismissible = true,
  showCloseButton = true,
  registerHref = "",
}: EmailGateModalProps) {
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<EmailGateFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
  });

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setRootError(null);
      form.reset({ email: "" });
    }
  }, [open, form]);

  const cityLabel = city
    ? city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()
    : null;

  // 🔥 REAL email verification using your attendees API
  const checkEmail = async (email: string) => {
    const res = await fetch("/api/attendees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      return { exists: true };
    }

    if (res.status === 404) {
      return { exists: false };
    }

    return { exists: false, error: "Server error" };
  };

  const handleSubmit = async (values: EmailGateFormValues) => {
    setRootError(null);

    const trimmedEmail = values.email.trim().toLowerCase();

    // Call real API
    const result = await checkEmail(trimmedEmail);

    if (result.exists) {
      onComplete(trimmedEmail); // Mark verified
      onOpenChange(false); // Close modal
      return;
    }

    // Attendee not found
    setRootError(
      "Email not found. If you haven't registered for Guinness Matchday, please register to participate — or try another email."
    );
  };

  const {
    formState: { isSubmitting },
  } = form;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className="max-w-md bg-black text-white border-neutral-800"
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!dismissible) e.preventDefault();
        }}
      >
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <Image
            src="https://res.cloudinary.com/dw1ltt9iz/image/upload/v1763471645/Matchday-Logo_jnj6hl.webp"
            alt="Guinness Matchday"
            fill
            className="object-contain object-center"
            priority
          />
        </div>

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold uppercase" />
          <DialogDescription className="text-sm text-neutral-300">
            {cityLabel ? (
              <>
                To play Predict &amp; Win for{" "}
                <span className="font-semibold text-amber-300">
                  {cityLabel}
                </span>
                , enter the email you used to register for Guinness Matchday.
              </>
            ) : (
              <>Please enter your Guinness Matchday registration email.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-4 space-y-4"
          >
            <FormField
              control={form.control}
              name="email"
              rules={{
                required: "Please enter your email address.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address.",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-xs font-semibold tracking-wide uppercase text-neutral-300">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-amber-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-red-400" />
                </FormItem>
              )}
            />

            {rootError && (
              <div className="space-y-2 text-sm mt-1">
                <p className="text-red-400">{rootError}</p>
              </div>
            )}

            <div className="pt-4 mt-2 border-t border-neutral-900 flex justify-end gap-2">
              {dismissible && (
                <GXButton
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </GXButton>
              )}

              {/* If email NOT found → show Register button */}
              <div className="pt-4 mt-2 border-t border-neutral-900 flex flex-wrap justify-end gap-4">
                {dismissible && (
                  <GXButton
                    type="button"
                    variant="secondary"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </GXButton>
                )}

                {/* Primary: always allow them to submit again */}
                <GXButton
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Checking…"
                    : rootError
                    ? "Try another email"
                    : "Continue"}
                </GXButton>

                {/* Secondary: if email not found, offer registration as an option */}
                {rootError && registerHref && (
                  <Link href={registerHref}>
                    <GXButton variant="secondary">
                      Register for this Event
                    </GXButton>
                  </Link>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
