
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  FolderKanban,
  History,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "../logo";

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/file-management", label: "File Management", Icon: FolderKanban },
  { href: "/dashboard/members", label: "Members", Icon: Users },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  { href: "/dashboard/history", label: "History", Icon: History },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <div data-sidebar="sidebar" className="h-full w-full md:w-64">
      <nav className="flex h-full flex-col text-lg font-medium pt-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold mb-4 px-4 text-sidebar-foreground"
        >
          <Logo className="h-8 w-8" />
          <span className="font-headline">Nexus Assistant</span>
        </Link>
        <div className="flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                { "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90": pathname === item.href }
              )}
            >
              <item.Icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
        <div className="mt-auto p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground bg-sidebar-accent">
                <Logo className="h-8 w-8 rounded-full" />
                <div>
                    <p className="text-sm font-bold">Nexus</p>
                    <p className="text-xs">v1.0</p>
                </div>
            </div>
        </div>
      </nav>
    </div>
  );
}
