"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";

export function TopBar({ dark, toggleDark }: { dark: boolean; toggleDark: () => void }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-100/80 bg-white/75 px-6 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/60 px-3 py-1.5 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-1">
          <img src="/brand-logo.png" alt="HRMS" className="h-full w-full object-contain" />
        </div>
        <p className="text-xs font-semibold tracking-wide text-slate-600">HRMS Portal</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-1">
            <img src="/brand-logo.png" alt="HRMS user" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">{user?.email}</p>
            <p className="text-xs text-blue-600 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDark}
          className="rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
