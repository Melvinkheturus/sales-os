"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, ChevronRight, Loader2,
  Upload, AlertCircle, X, ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Helpers ────────────────────────────────────────────────────────────────

function setActiveBrandId(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("mergex_active_brand", id);
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getBrandInitials(name: string): string {
  return (
    name
      .split(/[\s_-]+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "B"
  );
}

// ── Color Options ──────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: "violet",  label: "Violet",  tailwind: "bg-violet-500",  ring: "ring-violet-500/60",  hex: "#8B5CF6" },
  { value: "indigo",  label: "Indigo",  tailwind: "bg-indigo-500",  ring: "ring-indigo-500/60",  hex: "#6366F1" },
  { value: "rose",    label: "Rose",    tailwind: "bg-rose-500",    ring: "ring-rose-500/60",    hex: "#F43F5E" },
  { value: "amber",   label: "Amber",   tailwind: "bg-amber-500",   ring: "ring-amber-500/60",   hex: "#F59E0B" },
  { value: "emerald", label: "Emerald", tailwind: "bg-emerald-500", ring: "ring-emerald-500/60", hex: "#10B981" },
  { value: "sky",     label: "Sky",     tailwind: "bg-sky-500",     ring: "ring-sky-500/60",     hex: "#0EA5E9" },
] as const;

type ColorValue = (typeof COLOR_OPTIONS)[number]["value"];

// ── Component ──────────────────────────────────────────────────────────────

export function BrandNewClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<ColorValue>("violet");

  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Mount guard for fade-in
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Auto-generate slug
  useEffect(() => {
    if (!slugEdited) setSlug(generateSlug(name));
  }, [name, slugEdited]);

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color) ?? COLOR_OPTIONS[0];
  const initials = getBrandInitials(name);

  // ── Logo Upload ────────────────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate client-side
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      setUploadError("Invalid type. Accepted: JPG, PNG, SVG, WebP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File too large. Max 2 MB.");
      return;
    }

    setUploadError(null);
    setLogoFile(file);
    setLogoUrl(null);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via our API
    setIsUploading(true);
    setUploadProgress(20);

    try {
      const form = new FormData();
      form.append("file", file);

      setUploadProgress(50);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      setUploadProgress(90);

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed.");
        setLogoFile(null);
        setLogoPreview(null);
        return;
      }

      setLogoUrl(data.url);
      setUploadProgress(100);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setLogoFile(null);
      setLogoPreview(null);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Form Submit ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !slug.trim()) return;
      if (isUploading) {
        setFormError("Please wait for the logo to finish uploading.");
        return;
      }

      setIsSubmitting(true);
      setFormError(null);

      try {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            color,
            description: description.trim() || null,
            logoUrl: logoUrl ?? null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setFormError(data.error ?? "Failed to create brand. Please try again.");
          setIsSubmitting(false);
          return;
        }

        setActiveBrandId(data.id);
        router.push("/dashboard");
      } catch {
        setFormError("An unexpected error occurred. Please try again.");
        setIsSubmitting(false);
      }
    },
    [name, slug, color, description, logoUrl, isUploading, router]
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-black text-white font-sans antialiased flex flex-col"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.35s ease" }}
    >
      {/* ── Top Nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#050507]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link
            href="/workspaces"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors text-xs font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Workspaces
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-700" />
          <span className="text-xs font-semibold text-white">New Brand</span>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <div className="max-w-xl">

          {/* Page Heading */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create New Brand
            </h1>
            <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
              Create a new operational workspace for your business unit.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">

            {/* ── Section 1: Basic Info ─────────────────────────────── */}
            <Section title="Basic Information">

              {/* Brand Name */}
              <Field label="Brand Name" required hint="Display name shown across the platform.">
                <input
                  id="brand-name"
                  type="text"
                  placeholder="e.g. MergeX Academy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  autoFocus
                  required
                  className={inputClass}
                />
              </Field>

              {/* Brand Slug */}
              <Field label="Brand Slug" required hint={
                slug ? (
                  <span className="flex items-center gap-1">
                    <span className="text-neutral-600">Preview:</span>
                    <span className="text-purple-400">workspace/</span>
                    <span className="text-white">{slug}</span>
                  </span>
                ) : "Auto-generated from name. Lowercase letters, numbers, hyphens only."
              }>
                <input
                  id="brand-slug"
                  type="text"
                  placeholder="e.g. mergex-academy"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setSlugEdited(true);
                  }}
                  maxLength={40}
                  required
                  className={`${inputClass} font-mono`}
                />
              </Field>

              {/* Brand Logo */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-neutral-200">
                  Brand Logo{" "}
                  <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <div className="flex items-start gap-4">
                  {/* Logo preview avatar */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-base font-bold text-white shadow-inner shrink-0 relative overflow-hidden border border-white/[0.08]"
                    style={{ backgroundColor: logoPreview ? "transparent" : selectedColor.hex }}
                  >
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    )}
                  </div>

                  {/* Upload zone */}
                  <div className="flex-1">
                    {logoFile ? (
                      /* File selected — show name + remove */
                      <div className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-xs text-neutral-300">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate flex-1 font-mono">{logoFile.name}</span>
                        {isUploading && (
                          <span className="text-neutral-500 shrink-0">{uploadProgress}%</span>
                        )}
                        {logoUrl && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="text-neutral-500 hover:text-white transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Drop zone */
                      <div
                        onDrop={handleFileDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 h-9 px-3.5 rounded-lg border border-dashed border-white/[0.12] hover:border-purple-500/40 hover:bg-purple-500/5 text-xs font-semibold text-neutral-500 hover:text-neutral-300 cursor-pointer transition-all"
                      >
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        Click or drag & drop to upload
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                      }}
                    />

                    {uploadError ? (
                      <p className="text-[10px] text-rose-400 font-mono mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {uploadError}
                      </p>
                    ) : (
                      <p className="text-[10px] text-neutral-600 font-mono mt-1.5">
                        PNG, JPG, SVG, WebP · Max 2 MB · Stored on Cloudinary
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </Section>

            {/* ── Section 2: Appearance ─────────────────────────────── */}
            <Section title="Workspace Appearance">

              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-neutral-200">
                  Brand Color{" "}
                  <span className="text-neutral-500 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setColor(opt.value)}
                      title={opt.label}
                      className={`w-7 h-7 rounded-lg ${opt.tailwind} transition-all duration-150 cursor-pointer relative ${
                        color === opt.value
                          ? `ring-2 ring-offset-2 ring-offset-black ${opt.ring} scale-110`
                          : "opacity-50 hover:opacity-90 hover:scale-105"
                      }`}
                    >
                      {color === opt.value && (
                        <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-600 font-mono">
                  Used for badge, workspace switcher and logo placeholder.
                </p>
              </div>

            </Section>

            {/* ── Section 3: Description ────────────────────────────── */}
            <Section title="Description">

              <Field
                label="Description"
                optional
                hint={
                  <span className="flex justify-between w-full">
                    <span>Shown on workspace cards in the selector.</span>
                    <span className="text-neutral-600">{description.length}/120</span>
                  </span>
                }
              >
                <textarea
                  id="brand-description"
                  placeholder="e.g. Management Consulting & Business Solutions"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={120}
                  rows={2}
                  className="px-3.5 py-2.5 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none leading-relaxed w-full"
                />
              </Field>

            </Section>

            {/* ── Section 4: Access ─────────────────────────────────── */}
            <Section title="Access">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#0E0E12] border border-white/[0.06]">
                <div className="w-4 h-4 rounded-full border-2 border-purple-500 flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Private Workspace</p>
                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5 leading-relaxed">
                    Access managed via role-based invitations. Only team members you invite can enter this workspace.
                  </p>
                </div>
              </div>
            </Section>

            {/* ── Error Banner ──────────────────────────────────────── */}
            {formError && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 font-medium">{formError}</p>
              </div>
            )}

            {/* ── Actions ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <Link
                href="/workspaces"
                className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || isUploading || !name.trim() || !slug.trim()}
                className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating...
                  </>
                ) : isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading logo...
                  </>
                ) : (
                  "Create Brand"
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

const inputClass =
  "h-10 w-full px-3.5 rounded-lg bg-[#0E0E12] border border-white/[0.08] text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition-all";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono border-b border-white/[0.04] pb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-neutral-200">
        {label}{" "}
        {required && <span className="text-rose-400">*</span>}
        {optional && <span className="text-neutral-500 font-normal">(Optional)</span>}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
          {hint}
        </p>
      )}
    </div>
  );
}
