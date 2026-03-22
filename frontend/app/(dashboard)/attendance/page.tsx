"use client";

import { useEffect, useState } from "react";
import { api, Attendance, Paginated } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, subDays } from "date-fns";
import { Clock, Download, ChevronLeft, ChevronRight } from "lucide-react";

export default function AttendancePage() {
  const [data, setData] = useState<Paginated<Attendance> | null>(null);
  const [page, setPage] = useState(1);
  const start = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const end = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    api.attendance
      .list({ page: String(page), per_page: "20", start_date: start, end_date: end })
      .then(setData)
      .catch(console.error);
  }, [page, start, end]);

  const exportCsv = () => {
    api.reports.attendance({ start_date: start, end_date: end }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${start}_${end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Clock className="h-5 w-5" />
          </div>
          Attendance
        </h1>
        <Button onClick={exportCsv} className="bg-blue-500 hover:bg-blue-600 text-white shadow-md">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Date</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Employee</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 text-slate-700">{format(new Date(a.date), "dd MMM yyyy")}</td>
                    <td className="p-4 font-medium text-slate-800">{a.employee_name || "-"}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                        a.status === "present" ? "bg-green-100 text-green-700" :
                        a.status === "wfh" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data?.items.length && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Clock className="h-12 w-12 text-slate-300" />
              <p>No attendance records</p>
            </div>
          )}
          {data && data.total_pages > 1 && (
            <div className="flex justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="text-sm text-slate-600">Page {page} of {data.total_pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)} className="rounded-lg">
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
