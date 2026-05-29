"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, ChevronDown, Check, Layers, LayoutGrid, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
}

// Simple client-side brand context — stored in localStorage
const STORAGE_KEY = "mergex_active_brand";

export function getActiveBrandId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveBrandId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id === null) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, id);
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent("mergex:brand-changed", { detail: { brandId: id } }));
}

// ── Brand avatar color palette ─────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
];

function getBrandInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getBrandAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────
export function BrandSwitcher({ brands }: { brands: BrandOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setActiveBrandIdState(getActiveBrandId());
  }, []);

  // Keep in sync with brand-changed events (e.g. from workspace selector)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ brandId: string | null }>).detail;
      setActiveBrandIdState(detail.brandId);
    };
    window.addEventListener("mergex:brand-changed", handler);
    return () => window.removeEventListener("mergex:brand-changed", handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;
  const activeBrandIndex = brands.findIndex((b) => b.id === activeBrandId);

  const select = (id: string | null) => {
    setActiveBrandId(id);
    setActiveBrandIdState(id);
    // Cache brand name for sidebar pill
    if (id) {
      const brand = brands.find((b) => b.id === id);
      if (brand) sessionStorage.setItem(`mergex_brand_name_${id}`, brand.name);
    }
    setOpen(false);
  };

  if (brands.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 h-8 px-2.5 rounded-md text-xs font-medium transition-all duration-150",
          "border border-border/50 hover:border-border",
          "bg-muted/40 hover:bg-muted text-foreground",
          open && "border-[#8B5CF6]/40 bg-[#8B5CF6]/5"
        )}
      >
        {activeBrand ? (
          <>
            {/* Colored avatar */}
            <div
              className={cn(
                "w-4 h-4 rounded shrink-0 flex items-center justify-center text-white text-[8px] font-bold",
                getBrandAvatarColor(activeBrandIndex)
              )}
            >
              {getBrandInitials(activeBrand.name)}
            </div>
            <span className="max-w-[96px] truncate">{activeBrand.name}</span>
          </>
        ) : (
          <>
            <Layers className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">All Brands</span>
          </>
        )}
        <ChevronDown
          className={cn(
            "w-3 h-3 text-muted-foreground transition-transform duration-150 shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-10 left-0 z-50 min-w-[200px] bg-card/95 backdrop-blur-md border border-white/60 dark:border-white/5 rounded-xl shadow-xl overflow-hidden">
          
          {/* Section header */}
          <div className="px-3 pt-2.5 pb-1">
            <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Brand Workspaces
            </p>
          </div>

          {/* All Brands option */}
          <button
            onClick={() => select(null)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-muted flex items-center justify-center shrink-0">
                <Layers className="w-3 h-3 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground leading-none">All Brands</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Global view</p>
              </div>
            </div>
            {activeBrandId === null && <Check className="w-3 h-3 text-[#8B5CF6] shrink-0" />}
          </button>

          <div className="border-t border-border/30 mx-3 my-1" />

          {/* Individual brands */}
          {brands.map((brand, i) => (
            <button
              key={brand.id}
              onClick={() => select(brand.id)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "w-5 h-5 rounded shrink-0 flex items-center justify-center text-white text-[8px] font-bold",
                    getBrandAvatarColor(i)
                  )}
                >
                  {getBrandInitials(brand.name)}
                </div>
                <div>
                  <p className="font-medium text-foreground leading-none">{brand.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{brand.slug}</p>
                </div>
              </div>
              {activeBrandId === brand.id && <Check className="w-3 h-3 text-[#8B5CF6] shrink-0" />}
            </button>
          ))}

          <div className="border-t border-border/30 mx-3 my-1" />

          {/* ── Workspace actions ──────────────────────────────────── */}
          <button
            onClick={() => { setOpen(false); router.push("/workspaces"); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            All Workspaces
          </button>

          <button
            onClick={() => { setOpen(false); router.push("/dashboard/settings"); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            New Brand
          </button>

          <div className="h-1" />
        </div>
      )}
    </div>
  );
}
