"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Lock, LogIn } from "lucide-react";
import { PORTAL_NAME, PORTAL_TAGLINE } from "@/lib/brand";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setAuth(res.access_token, res.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 animate-fade-in">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-8 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -right-20 bottom-6 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md border-white/70 bg-white/75 backdrop-blur-xl shadow-2xl shadow-blue-200/30 animate-scale-in">
        <CardHeader className="pb-4 text-center">
          <div className="mx-auto mb-5 flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3 shadow-lg shadow-blue-500/40 sm:h-36 sm:w-36 sm:p-3.5">
            <img src="/brand-logo.png" alt="" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl md:text-4xl">
            {PORTAL_NAME}
          </CardTitle>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{PORTAL_TAGLINE}</p>
          <p className="text-sm text-slate-500">Welcome. Sign in to continue.</p>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail className="h-4 w-4 text-blue-500" /> Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="border-slate-200 bg-white/70 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Lock className="h-4 w-4 text-blue-500" /> Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-slate-200 bg-white/70 focus:border-blue-500"
                required
              />
            </div>

            {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700"
              disabled={loading}
            >
              <LogIn className="mr-2 h-4 w-4" /> {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
