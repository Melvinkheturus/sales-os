"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  TrendingUp, Search, Plus, Filter, MoreHorizontal,
  Flame, Thermometer, Snowflake, ChevronUp, ChevronDown,
  Minus, ArrowUpRight, Loader2, Trash2, ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptionUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  designation: string | null;
  avatarUrl: string | null;
}

interface OptionStage {
  id: string;
  name: string;
  label: string;
  color: string | null;
}

interface OptionSource {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  stageId: string | null;
  sourceId: string | null;
  ownerId: string | null;
  icpScore: number;
  temperature: string;
  expectedValue: string | null;
  priority: string;
  services: string[];
  createdAt: string;
  owner?: OptionUser;
  stage?: OptionStage;
  source?: OptionSource;
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const leadFormSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  sourceId: z.string().optional(),
  stageId: z.string().optional(),
  ownerId: z.string().optional(),
  icpScore: z.coerce.number().min(0).max(100).default(0),
  temperature: z.enum(["HOT", "WARM", "COLD"]).default("COLD"),
  expectedValue: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  services: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

// ─── Helper Components ────────────────────────────────────────────────────────

function TemperatureIcon({ temp }: { temp?: string }) {
  if (!temp) return <Minus className="h-3.5 w-3.5 text-muted-foreground/40" />;
  if (temp === "HOT") return <Flame className="h-3.5 w-3.5 text-rose-500" />;
  if (temp === "WARM") return <Thermometer className="h-3.5 w-3.5 text-amber-500" />;
  return <Snowflake className="h-3.5 w-3.5 text-sky-500" />;
}

function IcpBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20" :
    score >= 60 ? "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20" :
    score >= 40 ? "text-orange-600 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20" :
    "text-muted-foreground bg-muted";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${color}`}>
      {score}
      {score >= 80 ? <ChevronUp className="h-2.5 w-2.5" /> :
       score >= 40 ? <ArrowUpRight className="h-2.5 w-2.5" /> :
       <ChevronDown className="h-2.5 w-2.5" />}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onAddClick: () => void;
}

function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
        <TrendingUp className="h-7 w-7 text-primary animate-pulse" />
      </div>
      <h3 className="text-base font-semibold">No leads yet</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Add your first lead manually to start managing your pipeline.
      </p>
      <Button size="sm" className="mt-4" onClick={onAddClick}>
        <Plus className="h-4 w-4 mr-1.5" />
        Add Lead
      </Button>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export function LeadsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<OptionStage[]>([]);
  const [sources, setSources] = useState<OptionSource[]>([]);
  const [owners, setOwners] = useState<OptionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      website: "",
      industry: "",
      sourceId: "",
      stageId: "",
      ownerId: "",
      icpScore: 0,
      temperature: "COLD",
      expectedValue: "",
      priority: "MEDIUM",
      services: "",
    },
  });

  // Fetch Options & Leads
  const fetchData = async () => {
    try {
      setLoading(true);
      const optRes = await fetch(`/api/crm/options`);
      if (optRes.ok) {
        const { stages, sources, owners } = await optRes.json();
        setStages(stages || []);
        setSources(sources || []);
        setOwners(owners || []);
      }

      const leadsRes = await fetch(`/api/crm/leads`);
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData || []);
      }
    } catch (error) {
      console.error("Error loading CRM data:", error);
      toast.error("Failed to load leads list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  // Handle Create Lead Submit
  const onSubmit = async (values: LeadFormValues) => {
    try {
      const servicesArray = values.services
        ? values.services.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/crm/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, services: servicesArray }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create lead");
      }

      toast.success("Lead created successfully");
      setIsDialogOpen(false);
      reset();
      fetchData();
    } catch (err: any) {
      console.error("Create lead error:", err);
      toast.error(err.message || "Something went wrong.");
    }
  };

  // Handle Delete Lead
  const handleDelete = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete lead");
      }
      toast.success("Lead deleted successfully");
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
    } catch (err: any) {
      console.error("Delete lead error:", err);
      toast.error(err.message || "Failed to delete lead.");
    }
  };

  // Filter Logic
  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      `${l.companyName} ${l.contactPerson} ${l.email || ""} ${l.phone || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || l.stageId === stageFilter;
    const matchSource = sourceFilter === "all" || l.sourceId === sourceFilter;
    const matchOwner = ownerFilter === "all" || l.ownerId === ownerFilter;
    return matchSearch && matchStage && matchSource && matchOwner;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">CRM Leads</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify, qualify, and track your active sales pipeline.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add New Lead</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Enter the lead details below to add them to your pipeline.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-xs font-semibold">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Enter company name..."
                    {...register("companyName")}
                    className="h-9 text-sm"
                  />
                  {errors.companyName && (
                    <span className="text-[10px] text-red-500 font-medium">{errors.companyName.message as string}</span>
                  )}
                </div>

                {/* Contact Person */}
                <div className="space-y-1.5">
                  <Label htmlFor="contactPerson" className="text-xs font-semibold">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="John Doe..."
                    {...register("contactPerson")}
                    className="h-9 text-sm"
                  />
                  {errors.contactPerson && (
                    <span className="text-[10px] text-red-500 font-medium">{errors.contactPerson.message as string}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-email" className="text-xs font-semibold">Email</Label>
                  <Input
                    id="dlg-email"
                    type="email"
                    placeholder="johndoe@company.com..."
                    {...register("email")}
                    className="h-9 text-sm"
                  />
                  {errors.email && (
                    <span className="text-[10px] text-red-500 font-medium">{errors.email.message as string}</span>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-phone" className="text-xs font-semibold">Phone</Label>
                  <Input
                    id="dlg-phone"
                    placeholder="+91..."
                    {...register("phone")}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Website */}
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-website" className="text-xs font-semibold">Website</Label>
                  <Input
                    id="dlg-website"
                    placeholder="https://..."
                    {...register("website")}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-industry" className="text-xs font-semibold">Industry</Label>
                  <Input
                    id="dlg-industry"
                    placeholder="SaaS / retail / etc..."
                    {...register("industry")}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Expected Deal Value */}
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-expectedValue" className="text-xs font-semibold">Expected Deal Value (₹)</Label>
                  <Input
                    id="dlg-expectedValue"
                    type="number"
                    placeholder="Value in INR..."
                    {...register("expectedValue")}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Source */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Source</Label>
                  <Select onValueChange={(v) => setValue("sourceId", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select Source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stage */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Initial Stage</Label>
                  <Select onValueChange={(v) => setValue("stageId", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((st) => (
                        <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Assign Owner</Label>
                  <Select onValueChange={(v) => setValue("ownerId", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select Owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {owners.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.firstName} {o.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Temperature */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Temperature</Label>
                  <Select defaultValue="COLD" onValueChange={(v: any) => setValue("temperature", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Cold/Warm/Hot" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLD">Cold</SelectItem>
                      <SelectItem value="WARM">Warm</SelectItem>
                      <SelectItem value="HOT">Hot</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Priority</Label>
                  <Select defaultValue="MEDIUM" onValueChange={(v: any) => setValue("priority", v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* ICP Score */}
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-icpScore" className="text-xs font-semibold">ICP Match (0-100)</Label>
                  <Input
                    id="dlg-icpScore"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85..."
                    {...register("icpScore")}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Services Interested */}
              <div className="space-y-1.5">
                <Label htmlFor="dlg-services" className="text-xs font-semibold">Services Interested</Label>
                <Input
                  id="dlg-services"
                  placeholder="Consulting, Web Development, Marketing (comma separated)..."
                  {...register("services")}
                  className="h-9 text-sm"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : "Create Lead"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: leads.length, bg: "bg-muted/30" },
          { label: "Hot Leads", value: leads.filter(l => l.temperature === "HOT").length, bg: "bg-rose-500/5 text-rose-500" },
          { label: "Avg ICP Score", value: leads.length ? Math.round(leads.reduce((s, l) => s + l.icpScore, 0) / leads.length) : 0, bg: "bg-emerald-500/5 text-emerald-500" },
          {
            label: "Pipeline Value",
            value: `₹${Math.round(
              leads.reduce((sum, l) => sum + (l.expectedValue ? parseFloat(l.expectedValue) : 0), 0)
            ).toLocaleString("en-IN")}`,
            bg: "bg-primary/5 text-primary"
          },
        ].map(({ label, value, bg }) => (
          <Card key={label} className="border border-border/30 shadow-none">
            <CardContent className={`p-4 rounded-xl ${bg}`}>
              <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter strip */}
      <div className="flex gap-2 flex-wrap items-center bg-card/30 p-3 rounded-xl border border-border/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search company, contacts, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-muted/20"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-36 h-8 text-xs bg-muted/20">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/60" />
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-36 h-8 text-xs bg-muted/20">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/60" />
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {owners.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.firstName} {o.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-36 h-8 text-xs bg-muted/20">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/60" />
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table Card */}
      <Card className="border border-border/40 shadow-none overflow-hidden rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-border bg-card/10">
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_40px] gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
            <span>Lead &amp; Company</span>
            <span>Pipeline Stage</span>
            <span>Temperature</span>
            <span>ICP Score</span>
            <span>Source</span>
            <span className="text-right" />
          </div>
        </CardHeader>
        <CardContent className="p-2 bg-card/5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-[#8B5CF6]" />
              <span className="text-xs">Loading Leads...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <EmptyState onAddClick={() => setIsDialogOpen(true)} />
          ) : (
            <div className="divide-y divide-border/20">
              {filteredLeads.map((lead) => {
                const initials = `${lead.contactPerson[0] || "L"}`.toUpperCase();
                return (
                  <div
                    key={lead.id}
                    className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_40px] items-center gap-4 px-4 py-3 hover:bg-muted/20 rounded-lg transition-all group text-xs border border-transparent hover:border-border/30 hover:shadow-xs"
                  >
                    {/* Company + Contact */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0 border border-[#8B5CF6]/10">
                        {lead.owner?.avatarUrl && (
                          <AvatarImage src={lead.owner.avatarUrl} alt={lead.contactPerson} />
                        )}
                        <AvatarFallback className="text-[10px] font-bold bg-[#8B5CF6]/10 text-[#8B5CF6]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{lead.companyName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {lead.contactPerson}{lead.industry ? ` · ${lead.industry}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Stage Badge */}
                    <div>
                      {lead.stage ? (
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${lead.stage.color || "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
                          {lead.stage.label}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </div>

                    {/* Temperature */}
                    <div className="flex items-center gap-1.5">
                      <TemperatureIcon temp={lead.temperature} />
                      <span className="text-[11px] text-muted-foreground font-medium capitalize">
                        {lead.temperature.toLowerCase()}
                      </span>
                    </div>

                    {/* ICP Match */}
                    <div className="flex items-center gap-2">
                      <IcpBadge score={lead.icpScore} />
                      <Progress value={lead.icpScore} className="h-1 w-12 hidden sm:block bg-muted/40" />
                    </div>

                    {/* Source */}
                    <span className="text-[11px] text-muted-foreground truncate font-medium">
                      {lead.source?.name || "—"}
                    </span>

                    {/* Actions Menu */}
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md border border-transparent hover:border-border/30 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => router.push(`/workspaces/${slug}/crm/leads/${lead.id}`)}
                            className="text-xs cursor-pointer flex items-center justify-between"
                          >
                            <span>View Profile</span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/40" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(lead.id)}
                            className="text-xs cursor-pointer text-red-500 focus:text-red-500 flex items-center justify-between"
                          >
                            <span>Delete Lead</span>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
