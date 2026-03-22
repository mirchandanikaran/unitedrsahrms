"use client";

import { useEffect, useState } from "react";
import { api, LeadershipDashboard, ManagerDashboard, EmployeeDashboard } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  TrendingUp,
  UserMinus,
  Palmtree,
  Briefcase,
} from "lucide-react";

const CARD_COLORS = [
  "from-blue-500 to-blue-600 shadow-blue-500/25",
  "from-sky-500 to-sky-600 shadow-sky-500/25",
  "from-indigo-500 to-indigo-600 shadow-indigo-500/25",
  "from-blue-600 to-indigo-600 shadow-blue-500/25",
  "from-rose-400 to-rose-500 shadow-rose-500/25",
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<
    LeadershipDashboard | ManagerDashboard | EmployeeDashboard | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (["admin", "hr", "leadership"].includes(user?.role || "")) {
          setData(await api.dashboards.leadership());
        } else if (user?.role === "manager") {
          setData(await api.dashboards.manager());
        } else {
          setData(await api.dashboards.employee());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (user) load();
  }, [user?.role]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-white border border-slate-100" />
        ))}
      </div>
    );
  }

  if (data && "headcount" in data) {
    const d = data as LeadershipDashboard;
    const periodLabel =
      d.attendance_summary?.period_start && d.attendance_summary?.period_end
        ? `${d.attendance_summary.period_start} – ${d.attendance_summary.period_end}`
        : null;
    const leaveDays = d.leave_trends?.total_leave_days ?? 0;
    const billable = d.utilization?.billable_allocation ?? 0;
    const totalAlloc = d.utilization?.total_allocation ?? 0;

    const kpiItems = [
      { label: "Total Headcount", value: d.headcount?.total || 0, icon: Users },
      { label: "Active", value: d.headcount?.active || 0, icon: UserCheck },
      { label: "Utilization %", value: `${d.utilization?.utilization_percent || 0}%`, icon: TrendingUp },
      { label: "New Joiners (month)", value: d.new_joiners || 0, icon: Calendar },
      { label: "Exits (month)", value: d.exits || 0, icon: UserMinus },
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Leadership Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpiItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${CARD_COLORS[i % CARD_COLORS.length]} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-800">Attendance summary</CardTitle>
              {periodLabel && <p className="text-xs font-normal text-slate-500">{periodLabel}</p>}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Present</p>
                    <p className="text-2xl font-bold text-slate-800">{d.attendance_summary?.present || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Absent</p>
                    <p className="text-2xl font-bold text-slate-800">{d.attendance_summary?.absent || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-800">Leave &amp; allocation</CardTitle>
              <p className="text-xs font-normal text-slate-500">Same period as attendance above</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100">
                    <Palmtree className="h-6 w-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Approved leave (days)</p>
                    <p className="text-2xl font-bold text-slate-800">{leaveDays}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                    <Briefcase className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Portfolio utilization</p>
                    <p className="text-2xl font-bold text-slate-800">{d.utilization?.utilization_percent ?? 0}%</p>
                    <p className="text-xs text-slate-500">
                      Billable {Math.round(billable)}% · Total allocation {Math.round(totalAlloc)}% (rolled up)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (data && "pending_leave_approvals" in data) {
    const d = data as ManagerDashboard;
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Manager Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Team Utilization", value: `${d.team_utilization || 0}%`, icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
            { label: "Pending Leave Approvals", value: d.pending_leave_approvals || 0, icon: Calendar, color: "bg-amber-100 text-amber-600" },
            { label: "Team Attendance Records", value: d.team_attendance_count || 0, icon: Clock, color: "bg-sky-100 text-sky-600" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (data && "attendance" in data) {
    const d = data as EmployeeDashboard;
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Present Days", value: d.attendance?.present_days || 0, icon: Clock },
            { label: "Absent Days", value: d.attendance?.absent_days || 0, icon: Calendar },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="border-0 shadow-lg shadow-slate-200/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${CARD_COLORS[i]} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return <div className="text-slate-500">No dashboard data available.</div>;
}
