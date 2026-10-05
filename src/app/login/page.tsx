import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in — NEXT WHITE" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <AuthForm requireInvite={Boolean(process.env.SIGNUP_CODE)} />;
}
