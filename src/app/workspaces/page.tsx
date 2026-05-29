import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WorkspaceSelectorClient } from "@/components/workspaces/workspace-selector-client";

export const metadata = {
  title: "Workspaces | MergeX Sales OS",
};

export default async function WorkspacesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const brands = await db.brand.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <WorkspaceSelectorClient
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }}
      userRole={user.role.name}
      brands={brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl ?? null,
        color: b.color ?? "violet",
        description: b.description ?? null,
        createdAt: b.createdAt.toISOString(),
      }))}
    />
  );
}

