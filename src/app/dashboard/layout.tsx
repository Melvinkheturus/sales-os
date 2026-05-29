"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandProvider } from "@/components/command/command-provider";

// Full-height routes — no padding, full overflow control
const FULLSCREEN_ROUTES = ["/dashboard/pipeline"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/dashboard/settings");
  const isFullscreen = FULLSCREEN_ROUTES.some(r => pathname.startsWith(r)) || isSettings;

  return (
    <CommandProvider>
      <div className="flex h-screen overflow-hidden dashboard-bg">
        {/* Desktop Sidebar */}
        {!isSettings && (
          <div className="hidden lg:flex">
            <Sidebar
              collapsed={sidebarCollapsed}
              onCollapse={setSidebarCollapsed}
            />
          </div>
        )}

        {/* Main content area */}
        {isSettings ? (
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <main className="flex-grow overflow-hidden flex flex-col">
              {children}
            </main>
          </div>
        ) : (
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col p-0">
            <div className="flex-grow flex flex-col overflow-hidden">
              <TopNav />
              {isFullscreen ? (
                // Full-height layout for pipeline, etc.
                <main className="flex-grow overflow-hidden flex flex-col">
                  {children}
                </main>
              ) : (
                <main className="flex-grow overflow-y-auto p-6 lg:p-8 relative">
                  {children}
                </main>
              )}
            </div>
          </div>
        )}
      </div>
    </CommandProvider>
  );
}
