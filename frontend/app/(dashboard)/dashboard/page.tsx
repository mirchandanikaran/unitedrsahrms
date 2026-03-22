"use client";

import { useEffect, useState } from "react";
import { api, LeadershipDashboard, ManagerDashboard, EmployeeDashboard } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Calendar, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

const CARD_COLORS = [
  "from-blue-500 to-blue-600 shadow-blue-500/25",
  "from-sky-500 to-sky-600 shadow-sky-500/25",
  "from-indigo-500 to-indigo-600 shadow-indigo-500/25",
  "from-blue-600 to-indigo-600 shadow-blue-500/25",
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
    const deptData = d.department_headcount || [];
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-800">Leadership Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Headcount", value: d.headcount?.total || 0, icon: Users },
            { label: "Active", value: d.headcount?.active || 0, icon: UserCheck },
            { label: "Utilization %", value: `${d.utilization?.utilization_percent || 0}%`, icon: TrendingUp },
            { label: "New Joiners", value: d.new_joiners || 0, icon: Calendar },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <Card key={i} className="overflow-hidden border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow duration-200">
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
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="text-slate-800">Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
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
              <CardTitle className="text-slate-800">Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {deptData.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deptData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500">No data</p>
              )}
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
