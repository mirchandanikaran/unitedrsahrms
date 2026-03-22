"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  FolderKanban,
  FileText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: string[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "hr", "manager", "employee", "leadership"] },
  { href: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr"] },
  { href: "/attendance", label: "Attendance", icon: Clock, roles: ["admin", "hr"] },
  { href: "/leaves", label: "Leaves", icon: Calendar, roles: ["admin", "hr", "manager", "employee"] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "hr"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["admin", "hr"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const visible = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/60 bg-gradient-to-b from-white to-blue-50/70 shadow-lg shadow-blue-100/40 backdrop-blur">
      <div className="flex h-20 items-center gap-3 border-b border-white/70 px-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 shadow-md shadow-blue-500/40">
          <img src="/logo.svg" alt="HRMS" className="h-full w-full object-contain" />
        </div>
        <div>
          <p className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-black tracking-tight text-transparent">HRMS</p>
          <p className="text-[11px] text-slate-500">People OS</p>
        </div>
      </div>
      <div className="px-4 pt-3 text-[11px] uppercase tracking-wide text-slate-400">Navigation</div>
      <nav className="space-y-1 p-3">
        {visible.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-600 hover:bg-white hover:shadow-sm hover:text-blue-600"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-blue-500 group-hover:text-blue-600")} />
              <span className="flex-1">{item.label}</span>
              {isActive ? <Sparkles className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-40" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
