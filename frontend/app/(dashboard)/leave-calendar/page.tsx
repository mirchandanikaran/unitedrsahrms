"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, CalendarDay, Holiday, LeaveCalendarMonth } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, CalendarRange, Trash2, Pencil, Plus } from "lucide-react";
import { formatDisplayDate } from "@/lib/dateFormat";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function padMonthKey(iso: string) {
  return iso.slice(0, 10);
}

function cellStyle(day: CalendarDay | undefined): string {
  if (!day) return "bg-white/80";
  const mand = day.mandatory_holidays.length > 0;
  const opt = day.optional_holidays.length > 0;
  const leaves = day.approved_leaves.length > 0;
  const selfLeave = day.approved_leaves.some((l) => l.is_self);
  if (mand) return "bg-amber-100/90 border-amber-300 ring-1 ring-amber-200";
  if (opt) return "bg-sky-50/90 border-sky-200 ring-1 ring-sky-100";
  if (leaves) return selfLeave ? "bg-emerald-50 ring-2 ring-blue-500 border-emerald-200" : "bg-emerald-50/80 border-emerald-200";
  return "bg-white/80 border-slate-100";
}

export default function LeaveCalendarPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth() + 1);
  const [cal, setCal] = useState<LeaveCalendarMonth | null>(null);
  const [err, setErr] = useState("");
  const [adminYear, setAdminYear] = useState(now.getFullYear());
  const [holidayRows, setHolidayRows] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newMandatory, setNewMandatory] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editMandatory, setEditMandatory] = useState(true);

  const loadCalendar = useCallback(() => {
    setErr("");
    api.leaves
      .calendar(y, m, "IN")
      .then(setCal)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load calendar"));
  }, [y, m]);

  const loadAdminHolidays = useCallback(() => {
    if (!isAdmin) return;
    api.leaves
      .holidays({ year: String(adminYear), region: "IN" })
      .then(setHolidayRows)
      .catch(console.error);
  }, [isAdmin, adminYear]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    loadAdminHolidays();
  }, [loadAdminHolidays]);

  const dayMap = useMemo(() => {
    const map = new Map<string, CalendarDay>();
    cal?.days.forEach((d) => map.set(padMonthKey(d.date), d));
    return map;
  }, [cal]);

  const cells = useMemo(() => {
    const first = new Date(y, m - 1, 1);
    const dim = new Date(y, m, 0).getDate();
    const startPad = (first.getDay() + 6) % 7;
    const out: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= dim; d++) out.push(d);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [y, m]);

  const prevMonth = () => {
    if (m <= 1) {
      setM(12);
      setY((x) => x - 1);
    } else setM((x) => x - 1);
  };
  const nextMonth = () => {
    if (m >= 12) {
      setM(1);
      setY((x) => x + 1);
    } else setM((x) => x + 1);
  };

  const addHoliday = async () => {
    if (!newName.trim() || !newDate) return alert("Name and date required");
    const dt = new Date(newDate + "T12:00:00");
    try {
      setLoading(true);
      await api.leaves.createHoliday({
        name: newName.trim(),
        date: newDate,
        year: dt.getFullYear(),
        is_optional: newMandatory ? 0 : 1,
        region: "IN",
      });
      setNewName("");
      setNewDate("");
      setNewMandatory(true);
      loadAdminHolidays();
      loadCalendar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const saveEdit = async () => {
    if (editId == null || !editName.trim() || !editDate) return;
    const dt = new Date(editDate + "T12:00:00");
    try {
      setLoading(true);
      await api.leaves.updateHoliday(editId, {
        name: editName.trim(),
        date: editDate,
        year: dt.getFullYear(),
        is_optional: editMandatory ? 0 : 1,
        region: "IN",
      });
      setEditId(null);
      loadAdminHolidays();
      loadCalendar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const removeHoliday = async (id: number) => {
    if (!confirm("Remove this holiday from the calendar?")) return;
    try {
      setLoading(true);
      await api.leaves.deleteHoliday(id);
      loadAdminHolidays();
      loadCalendar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (h: Holiday) => {
    setEditId(h.id);
    setEditName(h.name);
    setEditDate(h.date.slice(0, 10));
    setEditMandatory((h.is_optional ?? 0) === 0);
  };

  const monthLabel = `${formatDisplayDate(new Date(y, m - 1, 1))} – ${formatDisplayDate(new Date(y, m, 0))}`;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
            <CalendarRange className="h-5 w-5" />
          </div>
          Leave &amp; holiday calendar
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="min-w-[200px] text-center text-sm font-semibold text-slate-700">{monthLabel}</span>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Month view for <strong>India (IN)</strong> public / company holidays and <strong>approved</strong> employee leaves.
        Pending applications are not shown; the calendar updates when a manager or admin approves a leave.
      </p>

      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-amber-200 ring-1 ring-amber-300" /> Mandatory holiday
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-sky-100 ring-1 ring-sky-200" /> Optional holiday
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200" /> Approved leave
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-emerald-100 ring-2 ring-blue-500" /> Your approved leave
        </span>
      </div>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-800">{err}</CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-4 pt-6">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-500">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((dom, idx) => {
              if (dom == null) {
                return <div key={`e-${idx}`} className="min-h-[100px] rounded-lg bg-slate-50/50" />;
              }
              const key = `${y}-${String(m).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
              const day = dayMap.get(key);
              return (
                <div
                  key={key}
                  className={`flex min-h-[100px] flex-col rounded-lg border p-1.5 text-left text-xs transition-shadow ${cellStyle(day)}`}
                >
                  <span className="mb-1 font-bold text-slate-800">{dom}</span>
                  {day && (
                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      {day.mandatory_holidays.map((h) => (
                        <p key={h.id} className="truncate font-medium text-amber-900" title={h.name}>
                          {h.name}
                        </p>
                      ))}
                      {day.optional_holidays.map((h) => (
                        <p key={h.id} className="truncate text-sky-800" title={h.name}>
                          {h.name}
                        </p>
                      ))}
                      {day.approved_leaves.map((l) => (
                        <p
                          key={l.leave_id}
                          className={`truncate ${l.is_self ? "font-semibold text-blue-800" : "text-emerald-900"}`}
                          title={`${l.employee_name} — ${l.leave_type_name}`}
                        >
                          {l.employee_name.split(" ")[0]} · {l.leave_type_name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-0 shadow-lg shadow-indigo-100/80 ring-1 ring-indigo-100">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-800">Admin: mandatory &amp; optional holiday calendar</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600">Year</label>
                <Input
                  type="number"
                  className="w-28 rounded-xl"
                  value={adminYear}
                  onChange={(e) => setAdminYear(Number(e.target.value) || now.getFullYear())}
                />
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Update the organization holiday list once per year (India <code className="rounded bg-slate-100 px-1">IN</code>{" "}
              region). Changes apply immediately for all users.
            </p>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Holiday name</label>
                <Input className="w-56 rounded-xl" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Diwali" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                <Input type="date" className="rounded-xl" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={newMandatory} onChange={(e) => setNewMandatory(e.target.checked)} />
                Mandatory
              </label>
              <Button className="rounded-xl" onClick={addHoliday} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Add holiday
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holidayRows.map((h) =>
                    editId === h.id ? (
                      <tr key={h.id} className="border-t border-slate-100 bg-indigo-50/50">
                        <td className="px-4 py-2">
                          <Input type="date" className="rounded-lg" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                        </td>
                        <td className="px-4 py-2">
                          <Input className="rounded-lg" value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </td>
                        <td className="px-4 py-2">
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={editMandatory} onChange={(e) => setEditMandatory(e.target.checked)} />
                            Mandatory
                          </label>
                        </td>
                        <td className="px-4 py-2 text-slate-600">IN</td>
                        <td className="px-4 py-2">
                          <Button size="sm" className="rounded-lg" onClick={saveEdit} disabled={loading}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => setEditId(null)}>
                            Cancel
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={h.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-700">{formatDisplayDate(h.date)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{h.name}</td>
                        <td className="px-4 py-3">{(h.is_optional ?? 0) === 0 ? "Mandatory" : "Optional"}</td>
                        <td className="px-4 py-3 text-slate-600">{h.region || "—"}</td>
                        <td className="px-4 py-3">
                          <Button size="sm" variant="outline" className="mr-2 rounded-lg" onClick={() => startEdit(h)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-red-600 hover:bg-red-50"
                            onClick={() => removeHoliday(h.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              {holidayRows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No holidays for this year (region IN).</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
