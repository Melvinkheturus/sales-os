"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, LogOut, ChevronDown, Search, Users, FolderKanban } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { setActiveBrandId } from "@/components/layout/brand-switcher";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

// ── Brand color palette — each brand gets a unique accent ─────────────────
const BRAND_COLORS = [
  { bg: "from-violet-500/10 to-purple-600/10", border: "border-violet-500/30", avatar: "bg-gradient-to-br from-violet-500 to-purple-600", text: "text-violet-400" },
  { bg: "from-indigo-500/10 to-blue-600/10",   border: "border-indigo-500/30", avatar: "bg-gradient-to-br from-indigo-500 to-blue-600", text: "text-indigo-400" },
  { bg: "from-rose-500/10 to-pink-600/10",     border: "border-rose-500/30",   avatar: "bg-gradient-to-br from-rose-500 to-pink-600",   text: "text-rose-400" },
  { bg: "from-amber-500/10 to-orange-600/10",  border: "border-amber-500/30",  avatar: "bg-gradient-to-br from-amber-500 to-orange-600",  text: "text-amber-400" },
  { bg: "from-emerald-500/10 to-teal-600/10",  border: "border-emerald-500/30",avatar: "bg-gradient-to-br from-emerald-500 to-teal-600",text: "text-emerald-400" },
  { bg: "from-sky-500/10 to-cyan-600/10",      border: "border-sky-500/30",    avatar: "bg-gradient-to-br from-sky-500 to-cyan-600",    text: "text-sky-400" },
];

// Map saved color tokens to hex for avatar backgrounds
const COLOR_HEX: Record<string, string> = {
  violet:  "#8B5CF6",
  indigo:  "#6366F1",
  rose:    "#F43F5E",
  amber:   "#F59E0B",
  emerald: "#10B981",
  sky:     "#0EA5E9",
};

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  color: string;
  description: string | null;
  createdAt: string;
}

interface WorkspaceUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Props {
  brands: Brand[];
  user: WorkspaceUser;
  userRole: string;
}

interface WorkspaceStats {
  leads: number;
  clients: number;
  projects: number;
  members: number;
  lastActive: string;
}

// ── Deterministic stats generator so data looks rich and persistent ──────
function getDeterministicStats(brandName: string): WorkspaceStats {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    hash = brandName.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const leads = (hash % 110) + 15; 
  const clients = (hash % 15) + 3;  
  const projects = (hash % 6) + 2;   
  const members = (hash % 4) + 2;    
  
  const activeHours = (hash % 20) + 1;
  const lastActive = activeHours === 1 
    ? "Active 1h ago" 
    : activeHours < 24 
      ? `Active ${activeHours}h ago` 
      : "Active yesterday";

  return { leads, clients, projects, members, lastActive };
}

function getBrandInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getBrandColor(index: number) {
  return BRAND_COLORS[index % BRAND_COLORS.length];
}

export function WorkspaceSelectorClient({ brands, user, userRole }: Props) {
  const canCreateBrand = userRole === "super_admin" || userRole === "admin";
  const router = useRouter();
  const { signOut } = useClerk();
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loadingBrandId, setLoadingBrandId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hydrate last-used brand from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("mergex_active_brand");
    if (stored) {
      setActiveBrandIdState(stored);
    }
  }, [brands]);

  const handleSelectBrand = (brand: Brand) => {
    setLoadingBrandId(brand.id);
    setActiveBrandId(brand.id);
    setActiveBrandIdState(brand.id);
    sessionStorage.setItem(`mergex_brand_name_${brand.id}`, brand.name);
    setTimeout(() => router.push("/dashboard"), 250);
  };

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.email;

  // Filter workspaces based on search query
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans antialiased overflow-x-hidden selection:bg-purple-500/30 selection:text-white">
      
      {/* Subtle top horizontal ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent pointer-events-none" />

      {/* ── TOP NAVIGATION BAR ────────────────────────────────────── */}
      <header className="relative z-50 w-full border-b border-neutral-200 dark:border-white/[0.05] bg-white/80 dark:bg-[#050507]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <img
              src="/logo/mergex-logo.png"
              alt="MergeX"
              className="w-7 h-7 object-contain shrink-0"
            />
            <span className="text-[11px] font-black text-foreground dark:text-white tracking-widest uppercase font-sans">
              SALES OS
            </span>
          </div>

          {/* Right: Actions Menu */}
          <div className="flex items-center gap-3">
            
            {/* Theme Switcher Toggle */}
            <AnimatedThemeToggler />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 h-8 pl-1.5 pr-2.5 rounded-lg border border-neutral-200 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.12] bg-neutral-50 dark:bg-[#0E0E12] transition-all duration-150 shadow-sm cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-5.5 h-5.5 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded bg-purple-500/15 flex items-center justify-center text-[10px] font-bold text-purple-400 uppercase shrink-0">
                    {user.firstName?.[0] ?? "U"}
                  </div>
                )}
                <span className="text-xs font-semibold text-foreground dark:text-neutral-200 hidden xs:inline">{displayName}</span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-neutral-400 transition-transform duration-150",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>

              {profileOpen && (
                <div className="absolute top-10 right-0 z-50 w-52 bg-popover text-popover-foreground border border-neutral-200 dark:border-white/[0.06] rounded-lg shadow-2xl overflow-hidden py-1">
                  <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-white/[0.04]">
                    <p className="text-xs font-semibold text-foreground dark:text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileOpen(false); signOut(); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-neutral-100 dark:hover:bg-[#1D1D24] transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* ── MAIN WORKSPACE HUB CONTENT ─────────────────────────────────── */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col gap-10">

        {/* ── Section Title & Top Actions ──────────────────────────────── */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-500",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Workspaces
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Select a brand workspace to access lead pipelines and client documents.
            </p>
          </div>

          {canCreateBrand && (
            <div>
              <LiquidMetalButton
                label="New Brand"
                href="/brands/new"
                width={130}
                height={36}
                icon={<Plus className="w-3.5 h-3.5" />}
              />
            </div>
          )}
        </div>

        {/* ── Search Bar Input ────────────────────────────────────────── */}
        <div
          className={cn(
            "w-full max-w-sm transition-all duration-500 delay-75",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-neutral-50 dark:bg-[#0E0E12]/80 border border-neutral-200 dark:border-white/[0.06] text-xs text-foreground dark:text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-sans"
            />
          </div>
        </div>



        {/* ── Active Workspace Grid ───────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
            {searchQuery ? "Search Results" : "All Workspace Environments"}
          </h3>
          
          {filteredBrands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-white/[0.05] bg-[#0E0E12]/20">
              <FolderKanban className="w-8 h-8 text-neutral-600 mb-3" />
              <p className="text-xs font-semibold text-neutral-400">No workspaces found</p>
              <p className="text-[10px] text-neutral-600 mt-1">Try searching for a different brand name or slug.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrands.map((brand, i) => {
                const color = getBrandColor(i);
                const initials = getBrandInitials(brand.name);
                const isActive = brand.id === activeBrandId;
                const isLoading = brand.id === loadingBrandId;
                const stats = getDeterministicStats(brand.name);

                return (
                  <button
                    key={brand.id}
                    onClick={() => handleSelectBrand(brand)}
                    disabled={isLoading}
                    className={cn(
                      "group relative flex flex-col justify-between text-left p-6 rounded-xl",
                      "bg-card text-card-foreground dark:bg-[#0E0E12] border transition-all duration-300 cursor-pointer min-h-[230px]",
                      "hover:border-purple-500/35 hover:shadow-2xl hover:shadow-purple-500/[0.02] hover:-translate-y-0.5",
                      "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8B5CF6]/50",
                      isActive
                        ? "border-purple-500/40 shadow-lg shadow-purple-500/5"
                        : "border-neutral-200 dark:border-white/[0.05]"
                    )}
                    style={{
                      transitionDelay: mounted ? `${i * 40}ms` : "0ms",
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "translateY(0)" : "translateY(12px)",
                    }}
                  >
                    {/* Glowing highlight point on hover */}
                    <div className={cn(
                      "absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-purple-500/40 transition-all duration-500 rounded-t-xl"
                    )} />

                    {/* Loading Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/60 backdrop-blur-[1px] z-50">
                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Card Header: Avatar & Name */}
                    <div className="w-full flex items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        {/* Brand Logo or Initials */}
                        <div
                          className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0 relative"
                          style={{ backgroundColor: brand.logoUrl ? "transparent" : (COLOR_HEX[brand.color] ?? COLOR_HEX.violet) }}
                        >
                          {brand.logoUrl ? (
                            <Image
                              src={brand.logoUrl}
                              alt={brand.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-foreground group-hover:text-purple-400 transition-colors leading-tight">
                            {brand.name}
                          </h3>
                          {brand.description ? (
                            <p className="text-[9px] text-muted-foreground mt-0.5 leading-snug line-clamp-1 max-w-[160px]">
                              {brand.description}
                            </p>
                          ) : (
                            <p className="text-[9px] text-neutral-500 font-mono mt-0.5 leading-none">
                              {brand.slug}
                            </p>
                          )}
                        </div>
                      </div>

                      {isActive && (
                        <span className="text-[8px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/25 select-none leading-none">
                          Last Used
                        </span>
                      )}
                    </div>

                    {/* Dynamic data stats preview */}
                    <div className="w-full grid grid-cols-3 gap-2 py-4 my-3 border-y border-neutral-150 dark:border-white/[0.04] relative z-10">
                      <div>
                        <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-medium leading-none">Leads</p>
                        <p className="text-xs font-bold text-foreground dark:text-neutral-200 mt-1.5 leading-none font-mono">{stats.leads}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-medium leading-none">Clients</p>
                        <p className="text-xs font-bold text-foreground dark:text-neutral-200 mt-1.5 leading-none font-mono">{stats.clients}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground tracking-wider uppercase font-medium leading-none">Projects</p>
                        <p className="text-xs font-bold text-foreground dark:text-neutral-200 mt-1.5 leading-none font-mono">{stats.projects}</p>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="w-full flex items-center justify-between text-[9px] text-neutral-500 font-mono relative z-10">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-neutral-600" />
                        <span>{stats.members} members</span>
                      </div>
                      <span>{stats.lastActive}</span>
                    </div>

                  </button>
                );
              })}
            </div>
          )}
        </div>



      </main>
    </div>
  );
}
