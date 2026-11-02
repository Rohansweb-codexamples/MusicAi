import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Sign in — Music AI" };

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <AuthScreen mode="login" />;
}
