"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 shadow-lg shadow-blue-500/30">
        <img src="/brand-logo.png" alt="" aria-hidden />
      </div>
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
