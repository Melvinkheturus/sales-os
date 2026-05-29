"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { navGroups } from "@/config/navigation";

interface MobileSidebarProps {
  onClose: () => void;
}

export function MobileSidebar({ onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card border-r border-border/40">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <img 
            src="/logo/mergex-logo.png" 
            alt="MergeX Logo" 
            className="w-8 h-8 object-contain shrink-0" 
          />
          <span className="font-bold text-[11px] uppercase tracking-wider text-foreground">
            MERGEX SALES OS
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:bg-muted/50"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-[#8B5CF6]/5 text-[#8B5CF6] font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#8B5CF6]" : "text-muted-foreground")} />
                      <span className="flex-1 truncate">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border/30 p-3">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors",
            pathname.startsWith("/dashboard/settings") && "bg-[#8B5CF6]/5 text-[#8B5CF6]"
          )}
        >
          <Settings className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
