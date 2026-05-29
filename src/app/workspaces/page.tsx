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

  // ── Smart redirect: if user has an active brand, go straight to dashboard ──
  if (user.activeBrandId) {
    const brand = await db.brand.findUnique({
      where: { id: user.activeBrandId },
      select: { slug: true, status: true },
    });
    if (brand && brand.status === "active") {
      redirect(`/workspaces/${brand.slug}/dashboard`);
    }
    // Brand is archived or missing — clear activeBrandId so user picks again
    await db.user.update({
      where: { id: user.id },
      data: { activeBrandId: null },
    });
  }

  // ── Show the workspace hub for explicit selection ──────────────────────────
  const brands = await db.brand.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
  });

  const teammates = await db.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <WorkspaceSelectorClient
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        activeBrandId: user.activeBrandId,
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
      teammates={teammates.map((t) => ({
        id: t.id,
        email: t.email,
        firstName: t.firstName,
        lastName: t.lastName,
        designation: t.designation,
        role: {
          name: t.role.name,
          label: t.role.label,
        },
      }))}
    />
  );
}
