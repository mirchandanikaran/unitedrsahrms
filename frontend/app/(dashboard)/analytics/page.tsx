"use client";

import { useEffect, useState } from "react";
import { api, ExecutiveAnalytics } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from "recharts";
import { TrendingUp, Users, AlertTriangle, Calendar, Briefcase, BarChart3 } from "lucide-react";

const COLORS = ["#3b82f6", "#6366f1", "#0ea5e9", "#8b5cf6", "#06b6d4", "#a78bfa", "#38bdf8", "#818cf8"];

export default function AnalyticsPage() {
  const [data, setData] = useState<ExecutiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.analytics
      .executive()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading analytics...</div>;
  if (!data) return <div className="flex items-center justify-center py-20 text-slate-400">Unable to load analytics</div>;

  const kpis = [
    { label: "Active Headcount", value: data.headcount.active, icon: Users, color: "from-blue-500 to-blue-600" },
    { label: "Attrition Rate", value: `${data.attrition.rate_percent}%`, icon: AlertTriangle, color: "from-red-400 to-red-500" },
    { label: "Utilization", value: `${data.utilization.utilization_percent}%`, icon: Briefcase, color: "from-indigo-500 to-indigo-600" },
    { label: "Leave Liability", value: `${Math.round(data.leave_liability.total_liability_days)}d`, icon: Calendar, color: "from-amber-500 to-amber-600" },
    { label: "Pending Leaves", value: data.pending_leaves, icon: TrendingUp, color: "from-sky-500 to-sky-600" },
    { label: "Exits (Period)", value: data.attrition.exits_in_period, icon: AlertTriangle, color: "from-rose-400 to-rose-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
        Executive Analytics
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${k.color} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{k.label}</p>
                  <p className="text-2xl font-bold text-slate-800">{k.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hiring vs Exits */}
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Hiring vs Exits (Monthly)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.attrition.monthly}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="joins" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Joins" />
                <Bar dataKey="exits" fill="#ef4444" radius={[4, 4, 0, 0]} name="Exits" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Diversity Pie */}
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.department_diversity} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${percent}%`}>
                  {data.department_diversity.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tenure Distribution */}
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Tenure Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.tenure_distribution}>
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring Velocity */}
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Hiring Velocity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.hiring_velocity}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="hires" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Liability by Type */}
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Leave Liability by Type</h3>
            <div className="space-y-3">
              {data.leave_liability.by_type.map((lt, i) => {
                const pct = lt.total_entitled > 0 ? Math.round((lt.total_used / lt.total_entitled) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{lt.type}</span>
                      <span className="text-slate-500">{lt.total_used}/{lt.total_entitled} used ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Trends */}
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-slate-800">Attendance Trends (30 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.attendance_trends}>
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} dot={false} name="Present" />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} name="Absent" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Designation Distribution */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="pt-6">
          <h3 className="mb-4 font-semibold text-slate-800">Designation Breakdown</h3>
          <div className="flex flex-wrap gap-3">
            {data.designation_diversity.map((d, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-700">{d.name}</p>
                <p className="text-xl font-bold text-indigo-600">{d.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
