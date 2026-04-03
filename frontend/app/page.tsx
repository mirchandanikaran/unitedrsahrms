"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const status = await api.setup.status();
        if (!mounted) return;
        if (isAuthenticated()) {
          router.replace("/dashboard");
          return;
        }
        if (!status.initialized) {
          setMessage("Redirecting to first-time setup...");
          router.replace("/setup");
          return;
        }
        setMessage("Redirecting to login...");
        router.replace("/login");
      } catch {
        if (!mounted) return;
        setMessage("Redirecting...");
        router.replace("/login");
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 shadow-lg shadow-blue-500/30">
        <img src="/brand-logo.png" alt="" aria-hidden />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
