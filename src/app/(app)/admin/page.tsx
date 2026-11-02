import { redirect } from "next/navigation";
import { AdminView } from "@/components/admin-view";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Admin — Music AI" };

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  return <AdminView currentUserId={user.id} />;
}
