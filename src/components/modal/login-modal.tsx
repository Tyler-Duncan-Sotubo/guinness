"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { toast } from "sonner";
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

const LoginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof LoginSchema>;

type LoginModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoggedIn?: () => void;
  onRegisterRequested?: () => void;
};

export function LoginModal({
  open,
  onOpenChange,
  onLoggedIn,
  onRegisterRequested,
}: LoginModalProps) {
  const { update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const setTopError = (msg: string) =>
    form.setError("email", {
      message: msg,
    });

  const onSubmit = async (values: LoginValues) => {
    setIsSubmitting(true);
    setTopError(""); // clear any previous "top" error

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setLoginError("Invalid email or password");
      toast.error("Login failed", {
        description: "Invalid email or password",
      });
      return;
    }

    await update();
    window.location.reload();
    router.refresh();

    form.reset();
    onOpenChange(false);
    onLoggedIn?.();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-black text-white border border-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold leading-tight uppercase">
            Log in to your Match Day account
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-300 mt-1">
            Access Spin &amp; Win, take the Match Quiz and track your points for
            this Guinness Match Day event.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {loginError && (
                <p className="text-sm text-red-500 text-center">{loginError}</p>
              )}

              <GXButton
                type="submit"
                variant="primary"
                className="w-full tracking-[0.18em]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Log in"}
              </GXButton>

              <DividerWithText text="OR" />

              <GXButton
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  onRegisterRequested?.();
                }}
              >
                Create a new account
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
