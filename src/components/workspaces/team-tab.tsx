"use client";

import { Users, UserPlus, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Teammate {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  designation?: string | null;
  role: {
    name: string;
    label: string;
  };
}

interface RoleItem {
  role: string;
  perm: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  invitedAt: string;
}

interface TeamTabProps {
  teammates: Teammate[];
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteRole: string;
  setInviteRole: (val: string) => void;
  sendingInvite: boolean;
  handleSendInvite: () => void;
  userTab: "active" | "invited";
  setUserTab: (val: "active" | "invited") => void;
  pendingInvitesList: PendingInvite[];
  handleCancelInvite: (id: string, email: string) => void;
  handleDeactivate: (name: string) => void;
  rolesList: RoleItem[];
  newRoleTitle: string;
  setNewRoleTitle: (val: string) => void;
  newRoleDesc: string;
  setNewRoleDesc: (val: string) => void;
  handleAddCustomRole: () => void;
  handleRemoveCustomRole: (title: string) => void;
}

export function TeamTab({
  teammates,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  sendingInvite,
  handleSendInvite,
  userTab,
  setUserTab,
  pendingInvitesList,
  handleCancelInvite,
  handleDeactivate,
  rolesList,
  newRoleTitle,
  setNewRoleTitle,
  newRoleDesc,
  setNewRoleDesc,
  handleAddCustomRole,
  handleRemoveCustomRole,
}: TeamTabProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
          Team & Access
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage team permissions, invite new teammates and define custom workspace roles.
        </p>
      </div>

      {/* 2.1 Invite Users Card */}
      <div className="glass-frost-card rounded-[20px] shadow-sm border border-neutral-200 dark:border-white/5 p-5.5 bg-neutral-50/20 dark:bg-white/1 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-[#8B5CF6]" />
            Invite Users
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Send an email invitation to authorize a new teammate in the workspace.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Input 
            type="email"
            placeholder="colleague@mergex.in" 
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-9 text-xs flex-1 bg-white dark:bg-[#0A0A0E] border-neutral-200 dark:border-white/6" 
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="h-9 text-xs w-full sm:w-44 shrink-0 bg-white dark:bg-[#0A0A0E] border-neutral-200 dark:border-white/6">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rolesList.map(r => {
                const roleVal = r.role.toLowerCase().replace(/\s/g, "_");
                return (
                  <SelectItem key={r.role} value={roleVal}>
                    {r.role}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={handleSendInvite} 
            disabled={sendingInvite || !inviteEmail.includes("@")} 
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer h-9 px-4 rounded-lg"
          >
            {sendingInvite ? (
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            <span>Send Invite</span>
          </Button>
        </div>
      </div>

      {/* 2.2 User Directory Card */}
      <div className="glass-frost-card rounded-[20px] shadow-sm border border-neutral-200 dark:border-white/5 p-5.5 bg-neutral-50/20 dark:bg-white/1 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-[#8B5CF6]" />
            User Management
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Authorized workspace operators and pending invitations.
          </p>
        </div>

        {/* Tabs header */}
        <div className="flex border-b border-neutral-200 dark:border-white/5 pb-3 mb-2 gap-2">
          <button
            onClick={() => setUserTab("active")}
            className={cn(
              "pb-1.5 px-4 text-xs font-bold transition-all relative cursor-pointer",
              userTab === "active" ? "text-[#8B5CF6]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Active Members ({teammates.length})
            {userTab === "active" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5CF6] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setUserTab("invited")}
            className={cn(
              "pb-1.5 px-4 text-xs font-bold transition-all relative cursor-pointer",
              userTab === "invited" ? "text-[#8B5CF6]" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Invited Pending ({pendingInvitesList.length})
            {userTab === "invited" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B5CF6] rounded-full" />
            )}
          </button>
        </div>

        {/* Active Members list */}
        {userTab === "active" && (
          <div className="space-y-3">
            {teammates.map(t => {
              const initials = ((t.firstName?.[0] ?? "") + (t.lastName?.[0] ?? t.email[0])).toUpperCase();
              const teammateDisplayName = t.firstName ? `${t.firstName} ${t.lastName ?? ""}` : t.email;
              
              return (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-neutral-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0E] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-8.5 w-8.5 rounded-lg bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 flex items-center justify-center text-xs font-extrabold text-[#8B5CF6] shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate leading-none">{teammateDisplayName}</p>
                      <p className="text-[10px] text-muted-foreground/60 truncate leading-none mt-1">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider scale-95 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 font-semibold">
                      {t.role.label}
                    </Badge>
                    {t.role.name !== "super_admin" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeactivate(teammateDisplayName)}
                        className="h-7 text-[10px] font-bold text-neutral-500 hover:text-red-500 hover:bg-red-500/5 cursor-pointer"
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invited Pending list */}
        {userTab === "invited" && (
          <div className="space-y-3">
            {pendingInvitesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No pending invites found.
              </div>
            ) : (
              pendingInvitesList.map(p => {
                const initials = p.email[0].toUpperCase();
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-neutral-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0E] shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8.5 w-8.5 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-xs font-extrabold text-amber-500 shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate leading-none">{p.email}</p>
                        <p className="text-[10px] text-muted-foreground/60 truncate leading-none mt-1">Invited {p.invitedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider scale-95 border-amber-500/20 text-amber-600 bg-amber-500/5 font-semibold">
                        {p.role}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCancelInvite(p.id, p.email)}
                        className="h-7 text-[10px] font-bold text-neutral-500 hover:text-red-500 hover:bg-red-500/5 cursor-pointer"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2.3 Roles Matrix Card */}
      <div className="glass-frost-card rounded-[20px] shadow-sm border border-neutral-200 dark:border-white/5 p-5.5 bg-neutral-50/20 dark:bg-white/1 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-[#8B5CF6]" />
            Roles & Permissions
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Administrative role matrices defining operations limits.
          </p>
        </div>

        {/* Create Custom Role Section */}
        <div className="p-4 border border-neutral-200 dark:border-white/5 rounded-xl bg-purple-500/1 dark:bg-white/1 space-y-3">
          <h4 className="text-xs font-bold text-foreground">Create Custom Role</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Role Title</Label>
              <Input
                placeholder="Role Title (e.g. Sales Architect)..."
                value={newRoleTitle}
                onChange={e => setNewRoleTitle(e.target.value)}
                className="h-9 text-xs bg-white dark:bg-[#0A0A0E] border-neutral-200 dark:border-white/6"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Capabilities Description</Label>
              <Input
                placeholder="Description of capabilities..."
                value={newRoleDesc}
                onChange={e => setNewRoleDesc(e.target.value)}
                className="h-9 text-xs bg-white dark:bg-[#0A0A0E] border-neutral-200 dark:border-white/6"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={handleAddCustomRole}
              disabled={!newRoleTitle.trim() || !newRoleDesc.trim()}
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer h-8 px-3 rounded-lg"
            >
              + Create Role
            </Button>
          </div>
        </div>

        {/* Roles List */}
        <div className="space-y-2 mt-4">
          {rolesList.map(r => (
            <div key={r.role} className="p-3.5 border border-neutral-200 dark:border-white/5 rounded-xl bg-white dark:bg-[#0A0A0E] text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{r.role}</span>
                {!["Super Admin", "Admin", "CX Executive", "Viewer"].includes(r.role) && (
                  <button
                    onClick={() => handleRemoveCustomRole(r.role)}
                    className="text-red-500 hover:text-red-600 text-[10px] font-bold cursor-pointer font-sans"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-muted-foreground/80 mt-1.5 leading-relaxed">{r.perm}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
