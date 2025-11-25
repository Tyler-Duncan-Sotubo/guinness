"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import FormError from "@/components/ui/form-error";

const LoginSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(6, "Password too short"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered");
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const res = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (res?.error) {
      setLoginError("Invalid email or password");
      toast.error("Login failed", { description: "Invalid email or password" });
      return;
    }

    toast.success("Welcome back!", { description: "Redirecting..." });
    router.push("/dashboard"); // or your protected route
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
      {registered && (
        <p className="text-green-600 text-sm mb-3">
          Account created successfully — please log in.
        </p>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    placeholder="you@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="••••••••" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {loginError && <FormError message={loginError} />}

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Form>
    </div>
  );
}
