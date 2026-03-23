"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, AwardBadge, Employee } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Award, Plus, Trash2, Trophy } from "lucide-react";
import { formatDisplayDate } from "@/lib/dateFormat";

const BADGE_TYPES = ["Appreciation", "Team Player", "Innovation", "Leadership", "Customer Impact", "Consistency"];

export default function AwardsPage() {
  const { user } = useAuthStore();
  const isAdmin = ["admin", "hr"].includes(user?.role || "");
  const [awards, setAwards] = useState<AwardBadge[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [badgeType, setBadgeType] = useState(BADGE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [awardedOn, setAwardedOn] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadAwards = useCallback(async () => {
    setErr("");
    try {
      const params = isAdmin ? undefined : { employee_id: String(user?.employee_id || "") };
      const rows = await api.awards.list(params);
      setAwards(rows);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load awards");
    }
  }, [isAdmin, user?.employee_id]);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await api.employees.list({ page: "1", per_page: "100", status_filter: "active" });
      setEmployees(res.items);
    } catch (e) {
      console.error(e);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAwards();
  }, [loadAwards]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const myAwards = useMemo(() => {
    if (isAdmin) return awards;
    const own = user?.employee_id;
    return awards.filter((a) => (own ? a.employee_id === own : true));
  }, [awards, isAdmin, user?.employee_id]);

  const addAward = async () => {
    if (!employeeId || !title.trim()) {
      alert("Employee and title are required");
      return;
    }
    try {
      setLoading(true);
      await api.awards.create({
        employee_id: Number(employeeId),
        title: title.trim(),
        badge_type: badgeType.trim() || "Appreciation",
        description: description.trim() || undefined,
        awarded_on: awardedOn || undefined,
      });
      setEmployeeId("");
      setTitle("");
      setBadgeType(BADGE_TYPES[0]);
      setDescription("");
      setAwardedOn("");
      await loadAwards();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const removeAward = async (id: number) => {
    if (!confirm("Remove this award badge?")) return;
    try {
      setLoading(true);
      await api.awards.remove(id);
      await loadAwards();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Award className="h-5 w-5" />
        </div>
        Awards &amp; Recognition
      </h1>

      <p className="text-sm text-slate-600">
        Celebrate contributions with badge-based recognition. Employees can track earned badges in one place.
      </p>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-800">{err}</CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-0 shadow-lg shadow-violet-100/80 ring-1 ring-violet-100">
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-bold text-slate-800">Admin Badge Manager</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Employee</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Badge title</label>
                <Input className="rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Star Performer Q1" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Badge type</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  value={badgeType}
                  onChange={(e) => setBadgeType(e.target.value)}
                >
                  {BADGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Awarded on</label>
                <Input type="date" className="rounded-xl" value={awardedOn} onChange={(e) => setAwardedOn(e.target.value)} />
              </div>
              <div className="md:col-span-2 xl:col-span-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <Input className="rounded-xl" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />
              </div>
            </div>
            <Button className="rounded-xl" onClick={addAward} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              Grant award badge
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {myAwards.map((badge) => (
          <Card key={badge.id} className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="pt-6">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{badge.badge_type}</p>
                    <h3 className="font-semibold text-slate-800">{badge.title}</h3>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-red-600 hover:bg-red-50"
                    onClick={() => removeAward(badge.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-slate-600">{badge.description || "Recognized for valuable contribution."}</p>
              <div className="mt-4 space-y-1 text-xs text-slate-500">
                {isAdmin && <p>Employee: {badge.employee_name}</p>}
                <p>Awarded on: {formatDisplayDate(badge.awarded_on)}</p>
                <p>By: {badge.awarded_by_name || "System"}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {myAwards.length === 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="py-8 text-center text-sm text-slate-500">
            No award badges yet. {isAdmin ? "Grant one from the manager above." : "Badges awarded by admin/HR will appear here."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
