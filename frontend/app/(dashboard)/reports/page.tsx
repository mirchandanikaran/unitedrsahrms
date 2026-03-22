"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, subDays } from "date-fns";
import { FileText, Download, Users, Clock } from "lucide-react";

export default function ReportsPage() {
  const start = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const end = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);

  const download = (name: string, fn: () => Promise<Blob>) => {
    fn().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }).catch(console.error);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
          <FileText className="h-5 w-5" />
        </div>
        Reports
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow overflow-hidden group">
          <CardContent className="pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-slate-800">Employee Master</h3>
            <p className="mb-4 text-sm text-slate-500">Full employee list with details</p>
            <Button
              onClick={() => download("employee_master", () => api.reports.employeeMaster())}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow overflow-hidden group">
          <CardContent className="pt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600 mb-4 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-slate-800">Attendance Report</h3>
            <p className="mb-4 text-sm text-slate-500">Date range based export</p>
            <div className="mb-4 flex gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border-slate-200" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border-slate-200" />
            </div>
            <Button
              onClick={() =>
                download(
                  `attendance_${startDate}_${endDate}`,
                  () => api.reports.attendance({ start_date: startDate, end_date: endDate })
                )
              }
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
