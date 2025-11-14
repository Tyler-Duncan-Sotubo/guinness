// src/app/register/RegisterForm.tsx
"use client";

import { z } from "zod";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RegisterPayload, RegisterSuccess } from "@/types/auth";
import { useCreateMutation } from "@/hooks/use-create-mutation";
import DividerWithText from "@/components/ui/divider-with-text";

const RegisterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterForm() {
  const router = useRouter();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  // bridge RHF error setter to your hook's `setError` signature
  const setTopError = (msg: string) => form.setError("email", { message: msg });

  const create = useCreateMutation<RegisterPayload, RegisterSuccess>({
    endpoint: "/auth/register",
    successMessage: "Account created",
    onSuccess: () => {
      router.push("/login?registered=1");
    },
  });

  const onSubmit = (values: RegisterValues) =>
    create(
      values,
      setTopError, // setError
      () => form.reset(), // resetForm
      undefined // onClose (optional)
    );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-sm"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Jane Doe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="jane@example.com" />
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
        <Button type="submit">Create account</Button>

        <DividerWithText text="OR" />

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/login")}
          type="button"
        >
          Log in to existing account
        </Button>
      </form>
    </Form>
  );
}
