"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  CalendarDays,
  FileText,
  ChevronRight,
  Sparkles,
  ClipboardList,
  UserCircle,
  BarChart3,
  GitBranch,
  Award,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navItems: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles: string[] }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "hr", "manager", "employee", "leadership"] },
  { href: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr"] },
  { href: "/attendance", label: "Attendance", icon: Clock, roles: ["admin", "hr"] },
  { href: "/leaves", label: "Leaves", icon: Calendar, roles: ["admin", "hr", "manager", "employee"] },
  {
    href: "/leave-calendar",
    label: "Leave calendar",
    icon: CalendarDays,
    roles: ["admin", "hr", "manager", "employee", "leadership"],
  },
  { href: "/onboarding", label: "Onboarding", icon: ClipboardList, roles: ["admin", "hr", "employee"] },
  { href: "/profile", label: "My Profile", icon: UserCircle, roles: ["admin", "hr", "manager", "employee"] },
  { href: "/awards", label: "Awards", icon: Award, roles: ["admin", "hr", "manager", "employee", "leadership"] },
  { href: "/social", label: "Social Wall", icon: MessageSquare, roles: ["admin", "hr", "manager", "employee", "leadership"] },
  { href: "/reporting", label: "Reporting", icon: GitBranch, roles: ["admin", "hr", "manager", "employee", "leadership"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["admin", "hr", "leadership"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["admin", "hr"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const visible = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/60 bg-gradient-to-b from-white to-blue-50/70 shadow-lg shadow-blue-100/40 backdrop-blur">
      <div className="border-b border-white/70 px-4 pb-2 pt-5 text-[11px] uppercase tracking-wide text-slate-400">Navigation</div>
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
