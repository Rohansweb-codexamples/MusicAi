import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth-screen";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Create account — Music AI" };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return <AuthScreen mode="register" />;
}
