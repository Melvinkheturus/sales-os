import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata = { title: "Dashboard | MergeX Sales OS" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  // Fetch real database records from Neon PostgreSQL
  const brands = await db.brand.findMany({
    orderBy: { createdAt: "desc" }
  });
  
  const teammates = await db.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <DashboardClient 
      user={user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : null}
      teammates={teammates.map(t => ({
        id: t.id,
        email: t.email,
        firstName: t.firstName,
        lastName: t.lastName,
        designation: t.designation,
        role: {
          label: t.role.label
        }
      }))}
      brands={brands.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug
      }))}
    />
  );
}
