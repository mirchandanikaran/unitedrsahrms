"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle2 } from "lucide-react";
import { PORTAL_NAME, PORTAL_TAGLINE } from "@/lib/brand";

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex min-h-[4.75rem] w-full items-center justify-between gap-4 border-b border-slate-100/80 bg-white/80 px-5 py-3 backdrop-blur-xl shadow-sm sm:px-8">
      <Link
        href="/dashboard"
        className="group flex min-w-0 flex-1 items-center gap-4 rounded-xl py-1 pr-4 transition-opacity hover:opacity-90"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-[1.02] sm:h-[3.75rem] sm:w-[3.75rem]">
          <img src="/brand-logo.png" alt="" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-2xl font-black leading-[1.1] tracking-tight text-transparent sm:text-3xl md:text-4xl md:leading-tight">
            {PORTAL_NAME}
          </h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
            {PORTAL_TAGLINE}
          </p>
        </div>
      </Link>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/70 px-4 py-2 shadow-sm">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-gradient-to-br from-slate-100 to-blue-50 text-blue-600"
            aria-hidden
          >
            <UserCircle2 className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">{user?.email}</p>
            <p className="text-xs text-blue-600 capitalize">{user?.role}</p>
          </div>
        </div>
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
