"use client";

import { useEffect, useState } from "react";
import { api, Employee, Paginated } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Download, Users, ChevronLeft, ChevronRight } from "lucide-react";

export default function EmployeesPage() {
  const [data, setData] = useState<Paginated<Employee> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params: Record<string, string> = { page: String(page), per_page: "10" };
    if (search) params.search = search;
    api.employees.list(params).then(setData).catch(console.error);
  }, [page, search]);

  const exportCsv = () => {
    api.reports.employeeMaster().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employee_master.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
            <Users className="h-5 w-5" />
          </div>
          Employees
        </h1>
        <Button
          onClick={exportCsv}
          className="bg-blue-500 hover:bg-blue-600 text-white shadow-md"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by name, email, code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm pl-9 border-slate-200"
        />
      </div>
      <Card className="border-0 shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Code</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Name</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Email</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Department</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Status</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{e.employee_code}</td>
                    <td className="p-4 text-slate-700">{e.first_name} {e.last_name}</td>
                    <td className="p-4 text-slate-600">{e.email}</td>
                    <td className="p-4 text-slate-600">{e.department?.name || "-"}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${e.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{format(new Date(e.date_of_joining), "dd MMM yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data?.items.length && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <Users className="h-12 w-12 text-slate-300" />
              <p>No employees found</p>
            </div>
          )}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="text-sm text-slate-600">
                Page {page} of {data.total_pages} <span className="text-slate-400">({data.total} total)</span>
              </p>
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
