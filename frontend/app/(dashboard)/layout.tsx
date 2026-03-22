"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const authenticated = isAuthenticated();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authenticated && !pathname?.includes("/login")) {
      router.replace("/login");
    }
  }, [mounted, authenticated, router, pathname]);

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20" />;
  }

  if (!authenticated && !pathname?.includes("/login")) {
    return null;
  }

  if (pathname?.includes("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Sidebar />
      <div className="relative pl-64">
        <TopBar />
        <main className="animate-fade-in p-6">{children}</main>
      </div>
    </div>
  );
}
