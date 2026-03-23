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

function isSunday(year: number, month: number, dayOfMonth: number): boolean {
  return new Date(year, month - 1, dayOfMonth).getDay() === 0;
}

function isInactiveDay(day: CalendarDay | undefined, isSundayOff: boolean): boolean {
  if (isSundayOff) return true;
  if (!day) return false;
  return day.mandatory_holidays.length > 0 || day.optional_holidays.length > 0 || day.approved_leaves.length > 0;
}

function cellStyle(inactive: boolean): string {
  if (inactive) return "bg-slate-100 border-slate-300 text-slate-500";
  return "bg-blue-50/70 border-blue-200 text-slate-800";
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

  const upcomingInactiveDays = useMemo(() => {
    if (!cal) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return cal.days
      .map((d) => {
        const [yy, mm, dd] = d.date.slice(0, 10).split("-").map(Number);
        const dateObj = new Date(yy, mm - 1, dd);
        const sundayOff = isSunday(yy, mm, dd);
        const inactive = isInactiveDay(d, sundayOff);
        if (!inactive || dateObj < today) return null;
        const reasons: string[] = [];
        if (sundayOff) reasons.push("Sunday weekly off");
        if (d.mandatory_holidays.length > 0) reasons.push(...d.mandatory_holidays.map((h) => `Holiday: ${h.name}`));
        if (d.optional_holidays.length > 0) reasons.push(...d.optional_holidays.map((h) => `Optional holiday: ${h.name}`));
        if (d.approved_leaves.length > 0) {
          reasons.push(...d.approved_leaves.map((l) => `Leave: ${l.employee_name} (${l.leave_type_name})`));
        }
        return { date: d.date, reasons };
      })
      .filter((row): row is { date: string; reasons: string[] } => row !== null)
      .slice(0, 12);
  }, [cal]);

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
        Monday to Saturday are marked <strong>active</strong> by default. Sundays (weekly off), holidays, and approved leave
        days are marked <strong>inactive</strong> in grey.
      </p>

      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-blue-200 ring-1 ring-blue-300" /> Active working day
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-slate-300 ring-1 ring-slate-400" /> Inactive day (Sunday / holiday / leave)
        </span>
      </div>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-800">{err}</CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold text-slate-800">Upcoming inactive days</h2>
          <p className="mt-1 text-xs text-slate-500">
            Employees can use this list to plan upcoming time off and holidays.
          </p>
          {upcomingInactiveDays.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No upcoming inactive days in this month.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {upcomingInactiveDays.map((row) => (
                <div key={row.date} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-700">{formatDisplayDate(row.date)}</p>
                  <p className="text-xs text-slate-600">{row.reasons.join(" · ")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              const sundayOff = isSunday(y, m, dom);
              const inactive = isInactiveDay(day, sundayOff);
              return (
                <div
                  key={key}
                  className={`flex min-h-[100px] flex-col rounded-lg border p-1.5 text-left text-xs transition-shadow ${cellStyle(inactive)}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className={`font-bold ${inactive ? "text-slate-500" : "text-slate-800"}`}>{dom}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${inactive ? "bg-slate-300 text-slate-700" : "bg-blue-200 text-blue-700"}`}>
                      {inactive ? "Inactive" : "Active"}
                    </span>
                  </div>
                  {day && (
                    <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                      {sundayOff && (
                        <p className="truncate text-slate-600" title="Sunday weekly off">
                          Sunday weekly off
                        </p>
                      )}
                      {day.mandatory_holidays.map((h) => (
                        <p key={h.id} className="truncate font-medium text-slate-700" title={h.name}>
                          {h.name}
                        </p>
                      ))}
                      {day.optional_holidays.map((h) => (
                        <p key={h.id} className="truncate text-slate-600" title={h.name}>
                          {h.name}
                        </p>
                      ))}
                      {day.approved_leaves.map((l) => (
                        <p
                          key={l.leave_id}
                          className={`truncate ${l.is_self ? "font-semibold text-slate-700" : "text-slate-600"}`}
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
              <h2 className="text-lg font-bold text-slate-800">Admin Event Manager: holiday calendar</h2>
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
              Add, edit, or remove holiday events for India (
              <code className="rounded bg-slate-100 px-1">IN</code> region). Employee calendars and upcoming inactive days
              refresh immediately.
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
