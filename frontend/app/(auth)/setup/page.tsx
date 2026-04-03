"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Rocket, ShieldCheck, UserCog } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [form, setForm] = useState({
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
    admin_password: "",
    department_name: "Administration",
    department_code: "ADM",
    designation_name: "Administrator",
  });

  useEffect(() => {
    let mounted = true;
    api.setup
      .status()
      .then((s) => {
        if (!mounted) return;
        if (s.initialized) router.replace("/login");
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingStatus(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone("");
    setSubmitting(true);
    try {
      const res = await api.setup.initialize(form);
      setDone(`${res.message} Redirecting to login...`);
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Checking setup status...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="mx-auto grid max-w-5xl gap-6 pt-8 lg:grid-cols-2">
        <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Rocket className="h-6 w-6" />
              Welcome to PeoplePulse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-100">
            <p>This is a fresh installation. Complete this one-time onboarding to initialize your HRMS workspace.</p>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="h-4 w-4" />
                What this setup will create
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>First admin user and linked employee profile</li>
                <li>Default leave types</li>
                <li>Starter onboarding templates</li>
                <li>Welcome announcement</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/80 shadow-xl shadow-slate-200/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <UserCog className="h-5 w-5 text-blue-600" />
              First-time setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Admin first name*" value={form.admin_first_name} onChange={(e) => setForm({ ...form, admin_first_name: e.target.value })} required />
                <Input placeholder="Admin last name*" value={form.admin_last_name} onChange={(e) => setForm({ ...form, admin_last_name: e.target.value })} required />
              </div>
              <Input type="email" placeholder="Admin email*" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} required />
              <Input type="password" placeholder="Admin password* (min 8 chars)" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} required minLength={8} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Department name" value={form.department_name} onChange={(e) => setForm({ ...form, department_name: e.target.value })} />
                <Input placeholder="Department code" value={form.department_code} onChange={(e) => setForm({ ...form, department_code: e.target.value })} />
              </div>
              <Input placeholder="Designation name" value={form.designation_name} onChange={(e) => setForm({ ...form, designation_name: e.target.value })} />

              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              {done && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{done}</p>}

              <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
                {submitting ? "Initializing..." : "Complete setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
