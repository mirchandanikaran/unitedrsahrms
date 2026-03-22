"use client";

import { useEffect, useState } from "react";
import { api, Leave, Paginated, LeaveBalance, LeaveType } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function LeavesPage() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<Paginated<Leave> | null>(null);
  const [balance, setBalance] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balanceEmployeeId, setBalanceEmployeeId] = useState("");
  const [balanceForm, setBalanceForm] = useState({
    employee_id: "",
    leave_type_id: "",
    total_days: "",
    year: String(new Date().getFullYear()),
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.leaves.list({ page: String(page), per_page: "15" }).then(setLeaves).catch(console.error);
  }, [page]);

  useEffect(() => {
    api.leaves.balance().then(setBalance).catch(console.error);
    api.leaves.types().then(setLeaveTypes).catch(console.error);
  }, []);

  const canApprove = ["admin", "hr", "manager"].includes(user?.role || "");

  const approve = (id: number) => {
    api.leaves.approve(id, { status: "approved" }).then(() => {
      api.leaves.list({ page: String(page) }).then(setLeaves);
    }).catch(console.error);
  };
  const reject = (id: number) => {
    api.leaves.approve(id, { status: "rejected", rejection_reason: "Rejected" }).then(() => {
      api.leaves.list({ page: String(page) }).then(setLeaves);
    }).catch(console.error);
  };

  const isAdmin = user?.role === "admin";

  const refreshBalance = () => {
    const params: Record<string, string> = {};
    if (balanceEmployeeId) params.employee_id = balanceEmployeeId;
    api.leaves.balance(params).then(setBalance).catch(console.error);
  };

  const updateBalance = async () => {
    if (!balanceForm.employee_id || !balanceForm.leave_type_id || !balanceForm.total_days) {
      alert("Please fill employee, leave type, and total days.");
      return;
    }
    try {
      await api.leaves.updateBalance({
        employee_id: Number(balanceForm.employee_id),
        leave_type_id: Number(balanceForm.leave_type_id),
        total_days: Number(balanceForm.total_days),
        year: Number(balanceForm.year),
      });
      if (!balanceEmployeeId) setBalanceEmployeeId(balanceForm.employee_id);
      refreshBalance();
      alert("Leave balance updated.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update balance");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
          <Calendar className="h-5 w-5" />
        </div>
        Leaves
      </h1>
      {isAdmin && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-3 font-semibold text-slate-800">Admin: Update Leave Balance</h2>
            <div className="grid gap-3 md:grid-cols-5">
              <Input
                placeholder="Employee ID"
                value={balanceForm.employee_id}
                onChange={(e) => setBalanceForm({ ...balanceForm, employee_id: e.target.value })}
              />
              <select
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                value={balanceForm.leave_type_id}
                onChange={(e) => setBalanceForm({ ...balanceForm, leave_type_id: e.target.value })}
              >
                <option value="">Leave Type</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
              <Input
                placeholder="Total Days"
                type="number"
                value={balanceForm.total_days}
                onChange={(e) => setBalanceForm({ ...balanceForm, total_days: e.target.value })}
              />
              <Input
                placeholder="Year"
                type="number"
                value={balanceForm.year}
                onChange={(e) => setBalanceForm({ ...balanceForm, year: e.target.value })}
              />
              <Button onClick={updateBalance} className="bg-blue-600 text-white hover:bg-blue-700">
                Update
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                placeholder="View balances for Employee ID (optional)"
                value={balanceEmployeeId}
                onChange={(e) => setBalanceEmployeeId(e.target.value)}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={refreshBalance}>Refresh Balance</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {balance.length > 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-slate-800">Leave Balance</h2>
            <div className="flex flex-wrap gap-3">
              {balance.map((b) => (
                <div key={b.leave_type_id} className="rounded-xl border border-slate-100 bg-blue-50/50 px-4 py-3 min-w-[140px]">
                  <p className="text-sm text-slate-600">{b.leave_type_name}</p>
                  <p className="text-xl font-bold text-blue-600">{b.balance} days</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Employee</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Type</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Start - End</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Days</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  {canApprove && <th className="p-4 text-left text-sm font-semibold text-slate-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves?.items.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{l.employee_name || "-"}</td>
                    <td className="p-4 text-slate-600">{l.leave_type_name || "-"}</td>
                    <td className="p-4 text-slate-600">{format(new Date(l.start_date), "dd MMM")} - {format(new Date(l.end_date), "dd MMM yyyy")}</td>
                    <td className="p-4 text-slate-600">{l.days}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                        l.status === "approved" ? "bg-green-100 text-green-700" :
                        l.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    {canApprove && l.status === "pending" && (
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approve(l.id)} className="bg-green-500 hover:bg-green-600 text-white rounded-lg">
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => reject(l.id)} className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg">
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!leaves?.items.length && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Calendar className="h-12 w-12 text-slate-300" />
              <p>No leave records</p>
            </div>
          )}
          {leaves && leaves.total_pages > 1 && (
            <div className="flex justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="text-sm text-slate-600">Page {page} of {leaves.total_pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= leaves.total_pages} onClick={() => setPage(page + 1)} className="rounded-lg">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
