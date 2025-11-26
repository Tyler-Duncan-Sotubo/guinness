// components/modal/register-modal.tsx
"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { GXButton } from "@/components/ui/gx-button";
import DividerWithText from "@/components/ui/divider-with-text";
import { useCreateMutation } from "@/hooks/use-create-mutation";
import { useAppContext } from "@/server/provider/app-provider";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Minimum 6 characters"),
  phone: z.string().optional(),
});
type RegisterValues = z.infer<typeof RegisterSchema>;

// This matches your RegisterAndSpinSchema on the server
type RegisterAndSpinPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  acceptedTerms: boolean;
  acceptedMarketing: boolean;
  ageGatePassed: boolean;
  maxSpinsPerEvent: number;
};

type RegisterAndSpinSuccess = {
  message: string;
  user: { id: string; name: string | null; email: string };
  spin: { totalSpins: number; remainingSpins: number };
  // attendee / registration / event also come back if you need them
};

type RegisterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  maxSpinsPerEvent?: number;
  onRegistered?: (data: RegisterAndSpinSuccess) => void;
  onLoginRequested?: () => void;
};

export function RegisterModal({
  open,
  onOpenChange,
  eventId,
  maxSpinsPerEvent = 1,
  onRegistered,
  onLoginRequested,
}: RegisterModalProps) {
  const router = useRouter();
  const { update } = useSession();
  const { consent } = useAppContext(); // contains ageGatePassed + acceptedTerms
  const [lastCredentials, setLastCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const setTopError = (msg: string) => form.setError("email", { message: msg });

  const create = useCreateMutation<
    RegisterAndSpinPayload,
    RegisterAndSpinSuccess
  >({
    endpoint: `/events/${eventId}/register-and-spin`,
    successMessage: "Account created and spin recorded",
    onSuccess: async (data) => {
      // 1) Auto-login the user with the same credentials they just used
      if (lastCredentials) {
        await signIn("credentials", {
          email: lastCredentials.email,
          password: lastCredentials.password,
          redirect: false,
        });
      }

      // ✅ update session in-place
      await update();
      window.location.reload();
      router.refresh();

      // 2) Clean up / notify parent / refresh
      form.reset();
      onOpenChange(false);
      onRegistered?.(data);
      router.refresh();
    },
  });

  const onSubmit = (values: RegisterValues) => {
    // store credentials for later signIn
    setLastCredentials({
      email: values.email,
      password: values.password,
    });

    const payload: RegisterAndSpinPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone || null,
      acceptedTerms: consent.acceptedTerms,
      acceptedMarketing: false, // or wire checkbox
      ageGatePassed: consent.ageGatePassed,
      maxSpinsPerEvent,
    };

    create(payload, setTopError);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-black text-white border border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-tight uppercase">
            Create your Match Day account
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-300 mt-1">
            Register to play Spin &amp; Win, take the Match Quiz and track your
            points for this Guinness Match Day event.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-neutral-300">
                      Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Jane Doe"
                        className="bg-black border-neutral-800 text-sm"
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
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder="jane@example.com"
                        className="bg-black border-neutral-800 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-[0.7rem]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-neutral-300">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        placeholder="••••••••"
                        className="bg-black border-neutral-800 text-sm"
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
                      Phone (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+234..."
                        className="bg-black border-neutral-800 text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-[0.7rem]" />
                  </FormItem>
                )}
              />

              <GXButton
                type="submit"
                variant="primary"
                className="w-full tracking-[0.18em]"
              >
                Create account &amp; spin
              </GXButton>

              <DividerWithText text="OR" />

              <GXButton
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  onOpenChange(false); // close Register modal
                  onLoginRequested?.(); // tell parent to open login modal
                }}
              >
                Log in to existing account
              </GXButton>
            </form>
          </Form>
        </div>

        <p className="mt-4 text-[0.65rem] text-neutral-500">
          By continuing you confirm you are of legal drinking age and accept the
          Guinness Match Day terms &amp; conditions. Please drink responsibly.
        </p>
      </DialogContent>
    </Dialog>
  );
}
