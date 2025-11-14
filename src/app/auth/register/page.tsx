import { auth } from "@/server/auth/auth";
import { redirect } from "next/navigation";
import RegisterForm from "./_components/register-form";

export default async function RegisteredPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/registered");

  return <RegisterForm />;
}
