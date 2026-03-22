"use client";

import { useEffect, useState } from "react";
import { api, Employee, Paginated, Department, Designation } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, Download, Users, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Paginated<Employee> | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    date_of_joining: "",
    department_id: "",
    designation_id: "",
    status: "active",
  });
  const isAdmin = user?.role === "admin";

  const loadEmployees = () => {
    const params: Record<string, string> = { page: String(page), per_page: "10" };
    if (search) params.search = search;
    api.employees.list(params).then(setData).catch(console.error);
  };

  useEffect(() => {
    loadEmployees();
  }, [page, search]);

  useEffect(() => {
    api.employees.departments().then(setDepartments).catch(console.error);
    api.employees.designations().then(setDesignations).catch(console.error);
  }, []);

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

  const addEmployee = async () => {
    if (!form.employee_code || !form.first_name || !form.last_name || !form.email || !form.date_of_joining || !form.department_id || !form.designation_id) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      await api.employees.create({
        employee_code: form.employee_code,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        date_of_joining: form.date_of_joining,
        department_id: Number(form.department_id),
        designation_id: Number(form.designation_id),
        status: "active",
      });
      setShowAdd(false);
      setForm({
        employee_code: "",
        first_name: "",
        last_name: "",
        email: "",
        date_of_joining: "",
        department_id: "",
        designation_id: "",
        status: "active",
      });
      loadEmployees();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add employee");
    }
  };

  const removeEmployee = async (id: number) => {
    if (!confirm("Remove this employee? This will set status to inactive.")) return;
    try {
      await api.employees.remove(id);
      loadEmployees();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove employee");
    }
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
      {isAdmin && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Admin Actions</h3>
              <Button variant="outline" onClick={() => setShowAdd((v) => !v)}>
                <Plus className="mr-2 h-4 w-4" />
                {showAdd ? "Cancel" : "Add Employee"}
              </Button>
            </div>
            {showAdd && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Input placeholder="Employee Code*" value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
                <Input placeholder="First Name*" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input placeholder="Last Name*" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                <Input placeholder="Email*" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Date of Joining*" type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
                <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
                  <option value="">Department*</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={form.designation_id} onChange={(e) => setForm({ ...form, designation_id: e.target.value })}>
                  <option value="">Designation*</option>
                  {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div className="md:col-span-3">
                  <Button onClick={addEmployee} className="bg-blue-600 text-white hover:bg-blue-700">Save Employee</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
                  {isAdmin && <th className="p-4 text-left text-sm font-semibold text-slate-600">Action</th>}
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
                    {isAdmin && (
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => removeEmployee(e.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </td>
                    )}
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
