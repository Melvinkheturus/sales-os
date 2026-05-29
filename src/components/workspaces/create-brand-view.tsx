"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Color options ─────────────────────────────────────────────────────────────
const COLOR_OPTIONS = [
  { key: "violet",  hex: "#8B5CF6", label: "Violet"  },
  { key: "indigo",  hex: "#6366F1", label: "Indigo"  },
  { key: "rose",    hex: "#F43F5E", label: "Rose"    },
  { key: "amber",   hex: "#F59E0B", label: "Amber"   },
  { key: "emerald", hex: "#10B981", label: "Emerald" },
  { key: "sky",     hex: "#0EA5E9", label: "Sky"     },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

interface CreateBrandViewProps {
  onBack: () => void;
  onCreated: (brand: {
    id: string; name: string; slug: string;
    logoUrl: string | null; color: string;
    description: string | null; createdAt: string;
  }) => void;
}

export function CreateBrandView({ onBack, onCreated }: CreateBrandViewProps) {
  const [name,        setName]        = useState("");
  const [slug,        setSlug]        = useState("");
  const [slugEdited,  setSlugEdited]  = useState(false);
  const [description, setDescription] = useState("");
  const [color,       setColor]       = useState("violet");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  const initials = name
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

  const selectedColor = COLOR_OPTIONS.find((c) => c.key === color) ?? COLOR_OPTIONS[0];

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res  = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), slug: slug || slugify(name), color, description }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create brand."); return; }
      onCreated({
        id: data.id, name: data.name, slug: data.slug,
        logoUrl: data.logoUrl ?? null, color: data.color ?? color,
        description: data.description ?? null,
        createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
      });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-neutral-300 dark:hover:border-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            New Brand Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create a new brand division to isolate leads, clients and pipelines.
          </p>
        </div>
      </div>

      {/* ── Preview Card + Form side-by-side on larger screens ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">

        {/* Form */}
        <div className="space-y-5">

          {/* Brand Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Brand Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="e.g. OVRN Studios"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate(); }}
              className="h-10 text-sm bg-white dark:bg-[#0A0A0E] border-neutral-200 dark:border-white/6 focus-visible:ring-purple-500/30"
              autoFocus
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              URL Slug
            </Label>
            <div className="flex items-center gap-0">
              <span className="h-10 px-3 flex items-center text-xs text-muted-foreground bg-neutral-100 dark:bg-white/[0.03] border border-r-0 border-neutral-200 dark:border-white/6 rounded-l-lg font-mono select-none">
                /
              </span>
              <Input
                value={slug}
                onChange={(e) => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
                placeholder="brand-slug"
                className="h-10 text-sm bg-white dark:bg-[#0A0A0E] border-neutral-200 dark:border-white/6 rounded-l-none font-mono focus-visible:ring-purple-500/30"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Auto-generated from name. Only lowercase letters, numbers and hyphens.</p>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Description <span className="text-neutral-500 font-normal normal-case">(optional)</span>
            </Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this brand division..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-[#0A0A0E] border border-neutral-200 dark:border-white/6 text-sm text-foreground placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all resize-none font-sans"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Brand Color
            </Label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  title={c.label}
                  onClick={() => setColor(c.key)}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all cursor-pointer relative flex items-center justify-center",
                    color === c.key
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: c.hex,
                    ["--tw-ring-color" as string]: c.hex,
                  }}
                >
                  {color === c.key && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-500 font-medium bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleCreate}
              disabled={saving || !name.trim()}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold px-6 h-10 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create Brand"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-sm text-muted-foreground hover:text-foreground h-10 px-4 cursor-pointer"
            >
              Cancel
            </Button>
          </div>

        </div>

        {/* Live Preview Card */}
        <div className="md:w-[220px] shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono mb-3">Preview</p>
          <div className="rounded-xl border border-neutral-200 dark:border-white/5 bg-card dark:bg-[#0E0E12] p-4 space-y-3 shadow-sm">

            {/* Avatar + Name */}
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-inner shrink-0"
                style={{ backgroundColor: selectedColor.hex }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate leading-tight">
                  {name || "Brand Name"}
                </p>
                <p className="text-[9px] text-muted-foreground font-mono mt-0.5 truncate">
                  /{slug || "brand-slug"}
                </p>
              </div>
            </div>



            {/* Color indicator */}
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedColor.hex }} />
              <span className="text-[9px] text-muted-foreground font-mono capitalize">{selectedColor.label}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Decorative separator */}
      <div className="flex items-center gap-4 pt-2">
        <div className="flex-1 h-px bg-neutral-100 dark:bg-white/4" />
        <Building2 className="w-3.5 h-3.5 text-neutral-400" />
        <div className="flex-1 h-px bg-neutral-100 dark:bg-white/4" />
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
        Each brand workspace is a fully isolated environment with its own lead pipeline, client directory, document templates, and analytics. Team members can be granted access to individual brands independently.
      </p>

    </div>
  );
}
