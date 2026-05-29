"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, User2, Mail, Phone, Globe, Shield, Sparkles,
  Flame, Thermometer, Snowflake, ChevronLeft, Loader2, Save, BadgeHelp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const overviewSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  sourceId: z.string().optional().or(z.literal("")),
  ownerId: z.string().optional().or(z.literal("")),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  temperature: z.enum(["HOT", "WARM", "COLD"]).default("COLD"),
  expectedValue: z.string().optional().or(z.literal("")),
  services: z.string().optional().or(z.literal("")),
});

type OverviewFormValues = z.infer<typeof overviewSchema>;

const businessReviewSchema = z.object({
  currentSituation: z.string().optional().or(z.literal("")),
  painPoints: z.string().optional().or(z.literal("")), // comma separated in UI
  opportunityNotes: z.string().optional().or(z.literal("")),
});

type BusinessReviewFormValues = z.infer<typeof businessReviewSchema>;

const bantSchema = z.object({
  bantBudget: z.coerce.number().min(0).max(100).default(0),
  bantAuthority: z.coerce.number().min(0).max(100).default(0),
  bantNeed: z.coerce.number().min(0).max(100).default(0),
  bantTimeline: z.coerce.number().min(0).max(100).default(0),
});

type BantFormValues = z.infer<typeof bantSchema>;

// ─── Interfaces ───────────────────────────────────────────────────────────────

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
  // Business Review
  currentSituation: string | null;
  painPoints: string[];
  opportunityNotes: string | null;
  // BANT
  bantBudget: number;
  bantAuthority: number;
  bantNeed: number;
  bantTimeline: number;
  bantScore: number;
  // Win/Loss
  winLossStatus: string | null;
  winLossReason: string | null;
  winLossNotes: string | null;
}

interface LeadDetailsClientProps {
  leadId: string;
}

export function LeadDetailsClient({ leadId }: LeadDetailsClientProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // States
  const [lead, setLead] = useState<Lead | null>(null);
  const [stages, setStages] = useState<OptionStage[]>([]);
  const [sources, setSources] = useState<OptionSource[]>([]);
  const [owners, setOwners] = useState<OptionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStage, setSavingStage] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);

  // Forms
  const overviewForm = useForm<any>({
    resolver: zodResolver(overviewSchema),
  });

  const businessReviewForm = useForm<any>({
    resolver: zodResolver(businessReviewSchema),
  });

  const bantForm = useForm<any>({
    resolver: zodResolver(bantSchema),
  });

  // Fetch data
  const loadLeadData = async () => {
    try {
      setLoading(true);

      // Options
      const optRes = await fetch(`/api/crm/options`);
      if (optRes.ok) {
        const { stages, sources, owners } = await optRes.json();
        setStages(stages || []);
        setSources(sources || []);
        setOwners(owners || []);
      }

      // Lead detail
      const leadRes = await fetch(`/api/crm/leads/${leadId}`);
      if (!leadRes.ok) {
        throw new Error("Failed to load lead details");
      }
      const data: Lead = await leadRes.json();
      setLead(data);

      // Reset forms
      overviewForm.reset({
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email || "",
        phone: data.phone || "",
        website: data.website || "",
        industry: data.industry || "",
        sourceId: data.sourceId || "",
        ownerId: data.ownerId || "",
        priority: data.priority as any,
        temperature: data.temperature as any,
        expectedValue: data.expectedValue ? String(data.expectedValue) : "",
        services: data.services.join(", "),
      });

      businessReviewForm.reset({
        currentSituation: data.currentSituation || "",
        painPoints: data.painPoints.join(", "),
        opportunityNotes: data.opportunityNotes || "",
      });

      bantForm.reset({
        bantBudget: data.bantBudget,
        bantAuthority: data.bantAuthority,
        bantNeed: data.bantNeed,
        bantTimeline: data.bantTimeline,
      });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load lead details");
      router.push(`/workspaces/${slug}/crm/leads`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadData();
  }, [leadId]);

  // Update inline properties (Stage / Owner)
  const handleStageChange = async (stageId: string) => {
    try {
      setSavingStage(true);
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      toast.success("Stage updated successfully");
      const updated = await res.json();
      setLead(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update stage");
    } finally {
      setSavingStage(false);
    }
  };

  const handleOwnerChange = async (ownerId: string) => {
    try {
      setSavingOwner(true);
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      if (!res.ok) throw new Error("Failed to update owner");
      toast.success("Owner updated successfully");
      const updated = await res.json();
      setLead(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to update owner");
    } finally {
      setSavingOwner(false);
    }
  };

  // Submit tabs
  const onOverviewSubmit = async (values: OverviewFormValues) => {
    try {
      const servicesArray = values.services
        ? values.services.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          services: servicesArray,
        }),
      });

      if (!res.ok) throw new Error("Failed to update overview");
      toast.success("Overview saved");
      const updated = await res.json();
      setLead(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to save overview");
    }
  };

  const onBusinessReviewSubmit = async (values: BusinessReviewFormValues) => {
    try {
      const painPointsArray = values.painPoints
        ? values.painPoints.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSituation: values.currentSituation,
          opportunityNotes: values.opportunityNotes,
          painPoints: painPointsArray,
        }),
      });

      if (!res.ok) throw new Error("Failed to update business review");
      toast.success("Business Review saved");
      const updated = await res.json();
      setLead(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to save business review");
    }
  };

  const onBantSubmit = async (values: BantFormValues) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to update BANT qualification");
      toast.success("Qualification metrics saved");
      const updated = await res.json();
      setLead(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to save BANT qualification");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
        <p className="text-sm text-muted-foreground">Loading Lead Profile...</p>
      </div>
    );
  }

  if (!lead) return null;

  const initials = `${lead.contactPerson[0] || "L"}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/workspaces/${slug}/crm/leads`)}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Leads
        </Button>

        {lead.winLossStatus && (
          <Badge className={lead.winLossStatus === "WON" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}>
            Outcome: {lead.winLossStatus} {lead.winLossReason ? `(${lead.winLossReason})` : ""}
          </Badge>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-6">
        {/* Left Column: Core Info Cards */}
        <div className="space-y-6">
          <Card className="border border-border/40 shadow-none overflow-hidden rounded-2xl bg-card/45 backdrop-blur-xs">
            <CardHeader className="flex flex-col items-center p-6 border-b border-border/20">
              <Avatar className="h-16 w-16 mb-3 border-2 border-[#8B5CF6]/20 shadow-md">
                <AvatarFallback className="text-lg font-bold bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-base text-foreground text-center">{lead.companyName}</h3>
              <p className="text-xs text-muted-foreground text-center mt-0.5">{lead.contactPerson}</p>

              <div className="mt-4 flex items-center gap-1">
                {lead.temperature === "HOT" && <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/10"><Flame className="h-3 w-3 mr-1" /> Hot</Badge>}
                {lead.temperature === "WARM" && <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"><Thermometer className="h-3 w-3 mr-1" /> Warm</Badge>}
                {lead.temperature === "COLD" && <Badge className="bg-sky-500/10 text-sky-500 hover:bg-sky-500/10"><Snowflake className="h-3 w-3 mr-1" /> Cold</Badge>}
                <Badge variant="outline" className="text-[10px] uppercase font-bold">{lead.priority} PRIORITY</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              {/* Stage dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pipeline Stage</Label>
                <Select disabled={savingStage} value={lead.stageId || ""} onValueChange={handleStageChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="No Stage Selected" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((st) => (
                      <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner dropdown */}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lead Owner</Label>
                <Select disabled={savingOwner} value={lead.ownerId || ""} onValueChange={handleOwnerChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((ow) => (
                      <SelectItem key={ow.id} value={ow.id}>
                        {ow.firstName} {ow.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border/20 pt-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span className="truncate">{lead.email || "No Email"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>{lead.phone || "No Phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <a href={lead.website || "#"} target="_blank" rel="noreferrer" className="hover:underline truncate text-primary/80">
                    {lead.website || "No Website"}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  <span>{lead.industry || "No Industry"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabbed Worksheets */}
        <div className="min-w-0">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/40 p-1 w-full justify-start overflow-x-auto flex h-10 border-b border-border/20 rounded-xl">
              <TabsTrigger value="overview" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Overview</TabsTrigger>
              <TabsTrigger value="review" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Business Review</TabsTrigger>
              <TabsTrigger value="bant" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Qualification</TabsTrigger>
              <TabsTrigger value="activities" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Activities</TabsTrigger>
              <TabsTrigger value="meetings" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Meetings</TabsTrigger>
              <TabsTrigger value="proposals" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Proposals</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs font-semibold px-4 rounded-lg data-[state=active]:bg-card">Documents</TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">Lead Profile Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={overviewForm.handleSubmit(onOverviewSubmit)} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="companyName" className="font-semibold">Company Name</Label>
                        <Input id="companyName" className="h-9 text-sm" {...overviewForm.register("companyName")} />
                        {overviewForm.formState.errors.companyName && (
                          <span className="text-red-500">{overviewForm.formState.errors.companyName.message as string}</span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="contactPerson" className="font-semibold">Contact Person</Label>
                        <Input id="contactPerson" className="h-9 text-sm" {...overviewForm.register("contactPerson")} />
                        {overviewForm.formState.errors.contactPerson && (
                          <span className="text-red-500">{overviewForm.formState.errors.contactPerson.message as string}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="font-semibold">Email</Label>
                        <Input id="email" type="email" className="h-9 text-sm" {...overviewForm.register("email")} />
                        {overviewForm.formState.errors.email && (
                          <span className="text-red-500">{overviewForm.formState.errors.email.message as string}</span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="font-semibold">Phone</Label>
                        <Input id="phone" className="h-9 text-sm" {...overviewForm.register("phone")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="website" className="font-semibold">Website</Label>
                        <Input id="website" className="h-9 text-sm" {...overviewForm.register("website")} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="industry" className="font-semibold">Industry</Label>
                        <Input id="industry" className="h-9 text-sm" {...overviewForm.register("industry")} />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="expectedValue" className="font-semibold">Expected Value (₹)</Label>
                        <Input id="expectedValue" type="number" className="h-9 text-sm" {...overviewForm.register("expectedValue")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-semibold">Temperature</Label>
                        <Select
                          value={overviewForm.watch("temperature")}
                          onValueChange={(v: any) => overviewForm.setValue("temperature", v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COLD">Cold</SelectItem>
                            <SelectItem value="WARM">Warm</SelectItem>
                            <SelectItem value="HOT">Hot</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold">Priority</Label>
                        <Select
                          value={overviewForm.watch("priority")}
                          onValueChange={(v: any) => overviewForm.setValue("priority", v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="font-semibold">Source</Label>
                        <Select
                          value={overviewForm.watch("sourceId") || "none"}
                          onValueChange={(v) => overviewForm.setValue("sourceId", v === "none" ? "" : v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Source</SelectItem>
                            {sources.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="services" className="font-semibold">Services Interested (comma separated)</Label>
                      <Input id="services" className="h-9 text-sm" placeholder="Web Dev, Marketing..." {...overviewForm.register("services")} />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={overviewForm.formState.isSubmitting}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        <Save className="h-4 w-4 mr-1.5" /> Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: BUSINESS REVIEW */}
            <TabsContent value="review" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-foreground">Lead Enrichment & Audits</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={businessReviewForm.handleSubmit(onBusinessReviewSubmit)} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <Label htmlFor="currentSituation" className="font-semibold">Current Business Situation</Label>
                      <Textarea
                        id="currentSituation"
                        placeholder="Describe the client's current workflow, scale, and operational background..."
                        rows={3}
                        {...businessReviewForm.register("currentSituation")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="painPoints" className="font-semibold">Pain Points Identified (comma separated)</Label>
                      <Input
                        id="painPoints"
                        placeholder="No Website, Low Conversion, Poor Branding..."
                        className="h-9 text-sm"
                        {...businessReviewForm.register("painPoints")}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="opportunityNotes" className="font-semibold">Opportunity Notes</Label>
                      <Textarea
                        id="opportunityNotes"
                        placeholder="Outline where MergeX services can support client growth gaps..."
                        rows={3}
                        {...businessReviewForm.register("opportunityNotes")}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={businessReviewForm.formState.isSubmitting}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        <Save className="h-4 w-4 mr-1.5" /> Save Audit
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: BANT QUALIFICATION */}
            <TabsContent value="bant" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-bold text-foreground">BANT Qualification Framework</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Qualification Score:</span>
                    <span className={`text-sm font-black px-2 py-0.5 rounded bg-primary/10 text-primary`}>
                      {lead.bantScore}/100
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={bantForm.handleSubmit(onBantSubmit)} className="space-y-6 text-xs py-2">
                    <div className="space-y-4">
                      {/* Budget */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Budget Fit (0 - 100)</Label>
                          <span className="font-bold text-primary">{bantForm.watch("bantBudget") || 0}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                          {...bantForm.register("bantBudget")}
                        />
                        <p className="text-[10px] text-muted-foreground">Client has the budget capability aligned with service pricing.</p>
                      </div>

                      {/* Authority */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Authority Fit (0 - 100)</Label>
                          <span className="font-bold text-primary">{bantForm.watch("bantAuthority") || 0}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                          {...bantForm.register("bantAuthority")}
                        />
                        <p className="text-[10px] text-muted-foreground">Communicating with the key decision makers and stakeholders.</p>
                      </div>

                      {/* Need */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Need Fit (0 - 100)</Label>
                          <span className="font-bold text-primary">{bantForm.watch("bantNeed") || 0}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                          {...bantForm.register("bantNeed")}
                        />
                        <p className="text-[10px] text-muted-foreground">MergeX services directly resolve structural business pain-points.</p>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold">Timeline Fit (0 - 100)</Label>
                          <span className="font-bold text-primary">{bantForm.watch("bantTimeline") || 0}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                          {...bantForm.register("bantTimeline")}
                        />
                        <p className="text-[10px] text-muted-foreground">Opportunity conversion urgency fits operation capacities.</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-border/20">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={bantForm.formState.isSubmitting}
                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
                      >
                        <Save className="h-4 w-4 mr-1.5" /> Save Scores
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sprint 3-7 Stubs */}
            <TabsContent value="activities" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardContent className="py-12 text-center text-muted-foreground text-xs">
                  <BadgeHelp className="h-10 w-10 text-muted-foreground/45 mx-auto mb-3" />
                  <p className="font-bold">Activity Timeline Under Construction</p>
                  <p className="text-[11px] mt-1 max-w-xs mx-auto">Sprint 3 will enable logging client communications, notes, and call outcomes.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meetings" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardContent className="py-12 text-center text-muted-foreground text-xs">
                  <BadgeHelp className="h-10 w-10 text-muted-foreground/45 mx-auto mb-3" />
                  <p className="font-bold">Meetings Scheduler Under Construction</p>
                  <p className="text-[11px] mt-1 max-w-xs mx-auto">Sprint 4 will introduce discovery meeting logs and scheduler integrations.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proposals" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardContent className="py-12 text-center text-muted-foreground text-xs">
                  <BadgeHelp className="h-10 w-10 text-muted-foreground/45 mx-auto mb-3" />
                  <p className="font-bold">Proposal Tracking Under Construction</p>
                  <p className="text-[11px] mt-1 max-w-xs mx-auto">Sprint 5 will allow tracking commercial proposal values and approval statuses.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <Card className="border border-border/40 shadow-none rounded-2xl bg-card/30">
                <CardContent className="py-12 text-center text-muted-foreground text-xs">
                  <BadgeHelp className="h-10 w-10 text-muted-foreground/45 mx-auto mb-3" />
                  <p className="font-bold">Documents Checklist Under Construction</p>
                  <p className="text-[11px] mt-1 max-w-xs mx-auto">Sprint 7 will enable checking agreement, quotation, and onboarding signatures.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
