"use client";

import { useState } from "react";
import { SettingsSidebar } from "./settings-sidebar";
import { SettingsWorkspaceHeader } from "./settings-workspace-header";

interface SettingsClientLayoutProps {
  roleName?: string;
  children: React.ReactNode;
}

export function SettingsClientLayout({ roleName, children }: SettingsClientLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-transparent h-screen">
      {/* Settings Navigation Sidebar */}
      <SettingsSidebar roleName={roleName} collapsed={collapsed} />

      {/* Settings Active Section Content Workspace (Card-based Layout) */}
      <div className="flex-1 flex flex-col bg-[#09090b]/40 p-1 lg:p-2 overflow-hidden h-full">
        <div className="flex-1 bg-card border border-border/20 rounded-xl lg:rounded-2xl shadow-xs flex flex-col overflow-hidden">
          <SettingsWorkspaceHeader 
            sidebarCollapsed={collapsed} 
            onToggleSidebar={() => setCollapsed(!collapsed)} 
          />
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-4xl mx-auto w-full space-y-6 text-left">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
