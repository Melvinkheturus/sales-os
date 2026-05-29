import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

async function verifyLeadAccess(leadId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized", status: 401 };

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      stage: {
        select: {
          id: true,
          name: true,
          label: true,
          color: true,
        },
      },
      source: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!lead) return { error: "Lead not found", status: 404 };

  const isAdmin = user.role.name === "super_admin" || user.role.name === "admin";
  if (!isAdmin) {
    const access = await db.userBrandAccess.findFirst({
      where: { userId: user.id, brandId: lead.brandId },
    });
    if (!access) {
      return { error: "Forbidden: No access to this workspace", status: 403 };
    }
  }

  return { lead, user };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await verifyLeadAccess(id);
  const { lead, user } = result;
  if (!lead || !user) {
    return NextResponse.json({ error: result.error || "Not Found" }, { status: result.status || 404 });
  }

  return NextResponse.json(lead);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await verifyLeadAccess(id);
  const { lead, user } = result;
  if (!lead || !user) {
    return NextResponse.json({ error: result.error || "Not Found" }, { status: result.status || 404 });
  }

  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      website,
      industry,
      sourceId,
      stageId,
      ownerId,
      icpScore,
      temperature,
      expectedValue,
      priority,
      services,
      // Sprint 2: Business Review
      currentSituation,
      painPoints,
      opportunityNotes,
      // Sprint 2: BANT
      bantBudget,
      bantAuthority,
      bantNeed,
      bantTimeline,
      // Sprint 6: Win/Loss
      winLossStatus,
      winLossReason,
      winLossNotes,
    } = body;

    // Calculate BANT score if any slider changes
    let finalBantScore = undefined;
    if (
      bantBudget !== undefined ||
      bantAuthority !== undefined ||
      bantNeed !== undefined ||
      bantTimeline !== undefined
    ) {
      const b = bantBudget !== undefined ? bantBudget : result.lead.bantBudget;
      const a = bantAuthority !== undefined ? bantAuthority : result.lead.bantAuthority;
      const n = bantNeed !== undefined ? bantNeed : result.lead.bantNeed;
      const t = bantTimeline !== undefined ? bantTimeline : result.lead.bantTimeline;
      finalBantScore = Math.round((b + a + n + t) / 4);
    }

    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        companyName: companyName !== undefined ? companyName : result.lead.companyName,
        contactPerson: contactPerson !== undefined ? contactPerson : result.lead.contactPerson,
        email: email !== undefined ? (email || null) : result.lead.email,
        phone: phone !== undefined ? (phone || null) : result.lead.phone,
        website: website !== undefined ? (website || null) : result.lead.website,
        industry: industry !== undefined ? (industry || null) : result.lead.industry,
        sourceId: sourceId !== undefined ? (sourceId || null) : result.lead.sourceId,
        stageId: stageId !== undefined ? (stageId || null) : result.lead.stageId,
        ownerId: ownerId !== undefined ? (ownerId || null) : result.lead.ownerId,
        icpScore: icpScore !== undefined ? icpScore : result.lead.icpScore,
        temperature: temperature !== undefined ? temperature : result.lead.temperature,
        expectedValue: expectedValue !== undefined ? (expectedValue ? parseFloat(expectedValue) : null) : result.lead.expectedValue,
        priority: priority !== undefined ? priority : result.lead.priority,
        services: services !== undefined ? services : result.lead.services,
        // Business Review
        currentSituation: currentSituation !== undefined ? currentSituation : result.lead.currentSituation,
        painPoints: painPoints !== undefined ? painPoints : result.lead.painPoints,
        opportunityNotes: opportunityNotes !== undefined ? opportunityNotes : result.lead.opportunityNotes,
        // BANT
        bantBudget: bantBudget !== undefined ? bantBudget : result.lead.bantBudget,
        bantAuthority: bantAuthority !== undefined ? bantAuthority : result.lead.bantAuthority,
        bantNeed: bantNeed !== undefined ? bantNeed : result.lead.bantNeed,
        bantTimeline: bantTimeline !== undefined ? bantTimeline : result.lead.bantTimeline,
        bantScore: finalBantScore !== undefined ? finalBantScore : result.lead.bantScore,
        // Win/Loss
        winLossStatus: winLossStatus !== undefined ? winLossStatus : result.lead.winLossStatus,
        winLossReason: winLossReason !== undefined ? winLossReason : result.lead.winLossReason,
        winLossNotes: winLossNotes !== undefined ? winLossNotes : result.lead.winLossNotes,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            label: true,
            color: true,
          },
        },
        source: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Failed to update lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await verifyLeadAccess(id);
  const { lead, user } = result;
  if (!lead || !user) {
    return NextResponse.json({ error: result.error || "Not Found" }, { status: result.status || 404 });
  }

  try {
    await db.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
