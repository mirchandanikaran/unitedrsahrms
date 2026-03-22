"use client";

import { useEffect, useState } from "react";
import { api, Leave, Paginated, LeaveBalance, LeaveType, Holiday } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInCalendarDays } from "date-fns";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/dateFormat";
import {
  Calendar, Check, X, ChevronLeft, ChevronRight, Plus, MapPin,
  MessageSquare, Clock, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";

export default function LeavesPage() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState<Paginated<Leave> | null>(null);
  const [balance, setBalance] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [balanceEmployeeId, setBalanceEmployeeId] = useState("");
  const [balanceForm, setBalanceForm] = useState({
    employee_id: "",
    leave_type_id: "",
    total_days: "",
    year: String(new Date().getFullYear()),
  });
  const [page, setPage] = useState(1);
  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    days: "",
    reason: "",
  });
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const canApprove = ["admin", "hr", "manager"].includes(user?.role || "");
  const isAdmin = user?.role === "admin";

  const refreshLeaves = () => {
    const params: Record<string, string> = { page: String(page), per_page: "15" };
    if (statusFilter) params.status_filter = statusFilter;
    api.leaves.list(params).then(setLeaves).catch(console.error);
  };

  const refreshBalance = () => {
    const params: Record<string, string> = {};
    if (balanceEmployeeId) params.employee_id = balanceEmployeeId;
    api.leaves.balance(params).then(setBalance).catch(console.error);
  };

  useEffect(() => { refreshLeaves(); }, [page, statusFilter]);
  useEffect(() => {
    api.leaves.balance().then(setBalance).catch(console.error);
    api.leaves.types().then(setLeaveTypes).catch(console.error);
    api.leaves.holidays({ year: String(new Date().getFullYear()) }).then(setHolidays).catch(console.error);
  }, []);

  const autoCalcDays = (start: string, end: string) => {
    if (start && end) {
      const d = differenceInCalendarDays(new Date(end), new Date(start)) + 1;
      return d > 0 ? String(d) : "";
    }
    return "";
  };

  const handleStartDate = (v: string) => {
    const days = autoCalcDays(v, applyForm.end_date);
    setApplyForm({ ...applyForm, start_date: v, days });
  };
  const handleEndDate = (v: string) => {
    const days = autoCalcDays(applyForm.start_date, v);
    setApplyForm({ ...applyForm, end_date: v, days });
  };

  const approve = async (id: number) => {
    try {
      await api.leaves.approve(id, { status: "approved" });
      refreshLeaves();
      refreshBalance();
    } catch (e) { console.error(e); }
  };

  const reject = async (id: number) => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.leaves.approve(id, { status: "rejected", rejection_reason: reason || "No reason provided" });
      refreshLeaves();
      refreshBalance();
    } catch (e) { console.error(e); }
  };

  const updateBalance = async () => {
    if (!balanceForm.employee_id || !balanceForm.leave_type_id || !balanceForm.total_days) {
      return alert("Please fill employee, leave type, and total days.");
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

  const applyLeave = async () => {
    if (!applyForm.leave_type_id || !applyForm.start_date || !applyForm.end_date || !applyForm.days) {
      return alert("Please fill leave type, start date, end date, and days");
    }
    if (!applyForm.reason.trim()) {
      return alert("Please provide a reason for your leave application");
    }
    try {
      await api.leaves.create({
        employee_id: 0,
        leave_type_id: Number(applyForm.leave_type_id),
        start_date: applyForm.start_date,
        end_date: applyForm.end_date,
        days: Number(applyForm.days),
        reason: applyForm.reason,
      });
      setShowApply(false);
      setApplyForm({ leave_type_id: "", start_date: "", end_date: "", days: "", reason: "" });
      refreshLeaves();
      api.leaves.balance().then(setBalance);
      alert("Leave application submitted successfully!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to submit leave");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Calendar className="h-5 w-5" />
          </div>
          Leaves
        </h1>
        <Button onClick={() => setShowApply(!showApply)} className="bg-blue-600 text-white hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" /> Apply Leave
        </Button>
      </div>

      {/* === APPLY LEAVE FORM === */}
      {showApply && (
        <Card className="border-0 shadow-lg shadow-blue-100/50 ring-2 ring-blue-100">
          <CardContent className="pt-6">
            <h2 className="mb-3 font-semibold text-slate-800">Apply for Leave</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="h-10 rounded-md border border-slate-200 px-3 text-sm"
                value={applyForm.leave_type_id}
                onChange={(e) => setApplyForm({ ...applyForm, leave_type_id: e.target.value })}
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                <Input type="date" value={applyForm.start_date} onChange={(e) => handleStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                <Input type="date" value={applyForm.end_date} onChange={(e) => handleEndDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Days (auto-calculated)</label>
                <Input type="number" value={applyForm.days} onChange={(e) => setApplyForm({ ...applyForm, days: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500 mb-1 block">Reason *</label>
                <textarea
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Describe the reason for your leave..."
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button onClick={applyLeave} className="bg-green-600 text-white hover:bg-green-700">Submit Application</Button>
              <Button variant="outline" onClick={() => setShowApply(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === ADMIN: UPDATE LEAVE BALANCE === */}
      {isAdmin && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-3 font-semibold text-slate-800">Admin: Update Leave Balance</h2>
            <div className="grid gap-3 md:grid-cols-5">
              <Input placeholder="Employee ID" value={balanceForm.employee_id} onChange={(e) => setBalanceForm({ ...balanceForm, employee_id: e.target.value })} />
              <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={balanceForm.leave_type_id} onChange={(e) => setBalanceForm({ ...balanceForm, leave_type_id: e.target.value })}>
                <option value="">Leave Type</option>
                {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
              <Input placeholder="Total Days" type="number" value={balanceForm.total_days} onChange={(e) => setBalanceForm({ ...balanceForm, total_days: e.target.value })} />
              <Input placeholder="Year" type="number" value={balanceForm.year} onChange={(e) => setBalanceForm({ ...balanceForm, year: e.target.value })} />
              <Button onClick={updateBalance} className="bg-blue-600 text-white hover:bg-blue-700">Update</Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input placeholder="View balances for Employee ID" value={balanceEmployeeId} onChange={(e) => setBalanceEmployeeId(e.target.value)} className="max-w-sm" />
              <Button variant="outline" onClick={refreshBalance}>Refresh</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === LEAVE BALANCE CARDS === */}
      {balance.length > 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-slate-800">Leave Balance</h2>
            <div className="flex flex-wrap gap-3">
              {balance.map((b) => (
                <div key={b.leave_type_id} className="rounded-xl border border-slate-100 bg-blue-50/50 px-4 py-3 min-w-[170px]">
                  <p className="text-sm font-medium text-slate-600">{b.leave_type_name}</p>
                  <p className="text-2xl font-bold text-blue-600">{b.balance}<span className="ml-1 text-xs font-normal text-slate-400">available</span></p>
                  <div className="mt-1 flex gap-3 text-xs text-slate-500">
                    <span className="text-green-600">{b.used_days} used</span>
                    {b.pending_days > 0 && <span className="text-amber-600">{b.pending_days} pending</span>}
                    <span>{b.total_days} total</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === HOLIDAYS === */}
      {holidays.length > 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
              <MapPin className="h-4 w-4 text-blue-500" /> Holidays ({new Date().getFullYear()})
            </h2>
            <div className="flex flex-wrap gap-2">
              {holidays.map((h) => (
                <div key={h.id} className="rounded-lg border border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-700">{h.name}</span>
                  <span className="ml-2 text-slate-400">{formatDisplayDate(h.date)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === STATUS FILTER === */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Filter:</span>
        {["", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* === LEAVE TABLE === */}
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Employee</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Type</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Dates</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Days</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Details</th>
                  {canApprove && <th className="p-4 text-left text-sm font-semibold text-slate-600">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {leaves?.items.map((l) => {
                  const isExpanded = expandedRow === l.id;
                  return (
                    <tr key={l.id} className="border-b border-slate-50 last:border-0 group">
                      <td className="p-4 font-medium text-slate-800">{l.employee_name || "—"}</td>
                      <td className="p-4 text-slate-600">{l.leave_type_name || "—"}</td>
                      <td className="p-4 text-slate-600 text-sm">
                        {formatDisplayDate(l.start_date)} – {formatDisplayDate(l.end_date)}
                      </td>
                      <td className="p-4 text-slate-700 font-semibold">{l.days}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium ${
                          l.status === "approved" ? "bg-green-100 text-green-700" :
                          l.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {l.status === "pending" && <Clock className="h-3 w-3" />}
                          {l.status === "approved" && <Check className="h-3 w-3" />}
                          {l.status === "rejected" && <X className="h-3 w-3" />}
                          {l.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : l.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? "Hide" : "View"}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                            <div>
                              <span className="font-medium text-slate-500">Reason: </span>
                              <span className="text-slate-700">{l.reason || "No reason provided"}</span>
                            </div>
                            {l.status === "rejected" && l.rejection_reason && (
                              <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2">
                                <span className="font-medium text-red-600">Rejection remark: </span>
                                <span className="text-red-700">{l.rejection_reason}</span>
                              </div>
                            )}
                            {l.status === "approved" && (
                              <div className="rounded-md bg-green-50 border border-green-100 px-3 py-2">
                                <span className="font-medium text-green-600">Approved</span>
                                {l.approved_by_name && <span className="text-green-700"> by {l.approved_by_name}</span>}
                                {l.approved_at && <span className="text-green-600"> on {formatDisplayDateTime(l.approved_at)}</span>}
                              </div>
                            )}
                            {l.created_at && (
                              <div className="text-slate-400 text-xs">
                                Applied on {formatDisplayDateTime(l.created_at)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      {canApprove && (
                        <td className="p-4">
                          {l.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approve(l.id)} className="bg-green-500 hover:bg-green-600 text-white rounded-lg">
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => reject(l.id)} className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg">
                                <X className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!leaves?.items.length && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Calendar className="h-12 w-12 text-slate-300" />
              <p>No leave records found</p>
            </div>
          )}
          {leaves && leaves.total_pages > 1 && (
            <div className="flex justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="text-sm text-slate-600">Page {page} of {leaves.total_pages} ({leaves.total} total)</p>
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
