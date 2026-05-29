import "dotenv/config";
import { PrismaClient, Permission } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting foundational seeding...");

  // 1. Define all granular Permissions
  const permissions = [
    { module: "brand",    action: "manage", description: "Create and manage brand workspaces" },
    { module: "users",    action: "invite", description: "Invite new team members" },
    { module: "users",    action: "manage", description: "Manage team member roles and active status" },
    { module: "roles",    action: "manage", description: "Configure system roles and permission mapping" },
    { module: "settings", action: "manage", description: "View and update workspace-wide preferences" },
    { module: "crm",      action: "view",   description: "Access and view sales pipeline/leads" },
    { module: "crm",      action: "create", description: "Create new leads or opportunities" },
    { module: "crm",      action: "edit",   description: "Update existing lead stages or metrics" },
    { module: "crm",      action: "delete", description: "Perform permanent deletions of CRM opportunities" },
    { module: "proposal", action: "manage", description: "Create, review, and accept commercial proposals" },
    { module: "client",   action: "view",   description: "Access and view client launch lists" },
    { module: "client",   action: "manage", description: "Update client launch milestones and health" },
  ];

  console.log("Upserting permissions...");
  const dbPermissions: Permission[] = [];
  for (const perm of permissions) {
    const dbPerm = await prisma.permission.upsert({
      where: {
        module_action: {
          module: perm.module,
          action: perm.action,
        },
      },
      update: {},
      create: {
        module: perm.module,
        action: perm.action,
      },
    });
    dbPermissions.push(dbPerm);
  }
  console.log(`✅ Upserted ${dbPermissions.length} permissions.`);

  // Helpers to fetch specific permission ids
  const getPermId = (mod: string, act: string) => {
    const found = dbPermissions.find(p => p.module === mod && p.action === act);
    if (!found) throw new Error(`Seeding error: Permission ${mod}.${act} not found.`);
    return found.id;
  };

  // 2. Define all system Roles
  const roles = [
    {
      name: "super_admin",
      label: "Super Admin",
      description: "Complete platform control. Emergency recovery permissions.",
      isSystem: true,
      permissions: dbPermissions.map(p => p.id), // All permissions
    },
    {
      name: "admin",
      label: "Admin",
      description: "Manage users, brands, settings, and CRM. Lacks role configuration controls.",
      isSystem: true,
      permissions: [
        getPermId("brand", "manage"),
        getPermId("users", "invite"),
        getPermId("users", "manage"),
        getPermId("settings", "manage"),
        getPermId("crm", "view"),
        getPermId("crm", "create"),
        getPermId("crm", "edit"),
        getPermId("crm", "delete"),
        getPermId("proposal", "manage"),
        getPermId("client", "view"),
        getPermId("client", "manage"),
      ],
    },
    {
      name: "cx_executive",
      label: "CX Executive",
      description: "Customer Success specialist. Access to CRM and client delivery workspaces.",
      isSystem: false,
      permissions: [
        getPermId("crm", "view"),
        getPermId("crm", "create"),
        getPermId("crm", "edit"),
        getPermId("client", "view"),
        getPermId("client", "manage"),
      ],
    },
    {
      name: "proposal_manager",
      label: "Proposal Manager",
      description: "Focused entirely on deal-level commerce and commercial proposals.",
      isSystem: false,
      permissions: [
        getPermId("crm", "view"),
        getPermId("proposal", "manage"),
      ],
    },
    {
      name: "engagement_manager",
      label: "Engagement Manager",
      description: "Nurturing opportunities and client handoffs.",
      isSystem: false,
      permissions: [
        getPermId("crm", "view"),
        getPermId("crm", "create"),
        getPermId("crm", "edit"),
        getPermId("client", "view"),
      ],
    },
    {
      name: "finance",
      label: "Finance Manager",
      description: "Division revenue audit, invoice logs, and pricing review.",
      isSystem: false,
      permissions: [
        getPermId("crm", "view"),
        getPermId("proposal", "manage"),
        getPermId("client", "view"),
      ],
    },
    {
      name: "viewer",
      label: "Viewer",
      description: "Global read-only directory and division lookups.",
      isSystem: true,
      permissions: [
        getPermId("crm", "view"),
        getPermId("client", "view"),
      ],
    },
  ];

  console.log("Upserting roles and permission mappings...");
  for (const roleDef of roles) {
    const dbRole = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        label: roleDef.label,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        name: roleDef.name,
        label: roleDef.label,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    // Wipe any existing permissions for this role to avoid duplicates
    await prisma.rolePermission.deleteMany({
      where: { roleId: dbRole.id },
    });

    // Seed permission pivot records
    for (const permId of roleDef.permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: dbRole.id,
          permissionId: permId,
        },
      });
    }
    console.log(`✅ Configured role: ${roleDef.label} with ${roleDef.permissions.length} permissions.`);
  }

  console.log("🎉 Seeding completed successfully. Ready for dynamic brand and user creation!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
