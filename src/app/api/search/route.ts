import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// ── Types ────────────────────────────────────────────────────────────────────
export interface SearchResult {
  id: string;
  entityType: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href?: string;
}

export interface SearchGroup {
  type: string;
  label: string;
  results: SearchResult[];
}

// ── Static navigation items ──────────────────────────────────────────────────
const NAV_ITEMS: SearchResult[] = [
  { id: "nav-dashboard", entityType: "nav", title: "Dashboard",       href: "/dashboard" },
  { id: "nav-team",      entityType: "nav", title: "Team & Access",   href: "/dashboard/team" },
  { id: "nav-pulse",     entityType: "nav", title: "Pulse Engine",    href: "/dashboard/pulse" },
  { id: "nav-settings",  entityType: "nav", title: "Settings",        href: "/dashboard/settings" },
];

// ── Quick actions ────────────────────────────────────────────────────────────
const ACTION_ITEMS: SearchResult[] = [
  { id: "action-settings",     entityType: "action", title: "Notification Settings", subtitle: "Configure Pulse preferences", href: "/dashboard/settings" },
];

// ── GET /api/search?q=query&limit=5 ─────────────────────────────────────────
export async function GET(request: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, brandId: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const perEntity = Math.min(parseInt(url.searchParams.get("limit") ?? "5"), 10);

  // ── Empty query: return nav + actions only ───────────────────────────────
  if (!q) {
    return NextResponse.json({
      query: "",
      groups: [
        { type: "action", label: "Quick Actions", results: ACTION_ITEMS },
        { type: "nav",    label: "Navigation",    results: NAV_ITEMS },
      ] satisfies SearchGroup[],
    });
  }

  const contains = q;
  const mode = "insensitive" as const;

  // ── Search foundational team members ──────────────────────────────────
  const users = await db.user.findMany({
    where: {
      isActive: true,
      OR: [
        { firstName: { contains, mode } },
        { lastName:  { contains, mode } },
        { email:     { contains, mode } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, email: true, role: { select: { label: true } } },
    take: perEntity,
  });

  // ── Filter static items ──────────────────────────────────────────────────
  const lq = q.toLowerCase();
  const navResults = NAV_ITEMS.filter(
    (n) =>
      n.title.toLowerCase().includes(lq) ||
      (n.subtitle?.toLowerCase().includes(lq) ?? false)
  );
  const actionResults = ACTION_ITEMS.filter(
    (a) =>
      a.title.toLowerCase().includes(lq) ||
      (a.subtitle?.toLowerCase().includes(lq) ?? false)
  );

  // ── Map to SearchResult ──────────────────────────────────────────────────
  const groups: SearchGroup[] = [];

  if (users.length) {
    groups.push({
      type: "user",
      label: "Team",
      results: users.map((u) => ({
        id:         u.id,
        entityType: "user",
        title:      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email,
        subtitle:   u.role.label,
        href:       `/dashboard/team`,
      })),
    });
  }

  if (navResults.length) {
    groups.push({ type: "nav", label: "Navigation", results: navResults });
  }

  if (actionResults.length) {
    groups.push({ type: "action", label: "Quick Actions", results: actionResults });
  }

  return NextResponse.json({ query: q, groups });
}
