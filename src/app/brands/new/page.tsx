import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandNewClient } from "@/components/brands/brand-new-client";

export default async function BrandNewPage() {
  const user = await getCurrentUser();

  // Auth guard
  if (!user) redirect("/sign-in");

  // Role guard — only super_admin and admin can create brands
  const allowedRoles = ["super_admin", "admin"];
  if (!allowedRoles.includes(user.role.name)) {
    redirect("/workspaces");
  }

  return <BrandNewClient />;
}
