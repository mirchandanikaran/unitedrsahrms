"use client";

import { useEffect, useState } from "react";
import { api, Employee, Paginated, Department, Designation } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDisplayDate } from "@/lib/dateFormat";
import { Search, Download, Users, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Save, X, Building2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<Paginated<Employee> | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeptManager, setShowDeptManager] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
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
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    department_id: "",
    designation_id: "",
    status: "active",
    address: "",
    emergency_contact: "",
  });
  const [newDept, setNewDept] = useState({ name: "", code: "", description: "" });
  const [editDept, setEditDept] = useState({ name: "", code: "", description: "" });
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

  const startEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setShowEdit(true);
    setEditForm({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      date_of_birth: emp.date_of_birth ? emp.date_of_birth.slice(0, 10) : "",
      department_id: String(emp.department_id || ""),
      designation_id: String(emp.designation_id || ""),
      status: emp.status || "active",
      address: emp.address || "",
      emergency_contact: emp.emergency_contact || "",
    });
  };

  const cancelEdit = () => {
    setShowEdit(false);
    setEditingEmployeeId(null);
    setEditForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      department_id: "",
      designation_id: "",
      status: "active",
      address: "",
      emergency_contact: "",
    });
  };

  const saveEdit = async () => {
    if (!editingEmployeeId) return;
    if (!editForm.first_name || !editForm.last_name || !editForm.email || !editForm.department_id || !editForm.designation_id) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      await api.employees.update(editingEmployeeId, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone || undefined,
        date_of_birth: editForm.date_of_birth || undefined,
        department_id: Number(editForm.department_id),
        designation_id: Number(editForm.designation_id),
        status: editForm.status,
        address: editForm.address || undefined,
        emergency_contact: editForm.emergency_contact || undefined,
      });
      cancelEdit();
      loadEmployees();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update employee");
    }
  };

  const startDepartmentEdit = (dept: Department) => {
    setEditingDepartmentId(dept.id);
    setEditDept({
      name: dept.name || "",
      code: dept.code || "",
      description: dept.description || "",
    });
  };

  const cancelDepartmentEdit = () => {
    setEditingDepartmentId(null);
    setEditDept({ name: "", code: "", description: "" });
  };

  const createDepartment = async () => {
    if (!newDept.name.trim()) {
      alert("Department name is required.");
      return;
    }
    try {
      await api.employees.createDepartment({
        name: newDept.name.trim(),
        code: newDept.code.trim() || undefined,
        description: newDept.description.trim() || undefined,
      });
      setNewDept({ name: "", code: "", description: "" });
      const rows = await api.employees.departments();
      setDepartments(rows);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create department");
    }
  };

  const saveDepartmentEdit = async () => {
    if (!editingDepartmentId) return;
    if (!editDept.name.trim()) {
      alert("Department name is required.");
      return;
    }
    try {
      await api.employees.updateDepartment(editingDepartmentId, {
        name: editDept.name.trim(),
        code: editDept.code.trim() || undefined,
        description: editDept.description.trim() || undefined,
      });
      cancelDepartmentEdit();
      const rows = await api.employees.departments();
      setDepartments(rows);
      loadEmployees();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update department");
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
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowAdd((v) => !v)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {showAdd ? "Cancel" : "Add Employee"}
                </Button>
                <Button variant="outline" onClick={() => setShowDeptManager((v) => !v)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  {showDeptManager ? "Hide Departments" : "Manage Departments"}
                </Button>
              </div>
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
            {showEdit && editingEmployeeId && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800">Edit Employee Details</h4>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input placeholder="First Name*" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                  <Input placeholder="Last Name*" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                  <Input placeholder="Email*" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                  <Input placeholder="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  <Input placeholder="Date of Birth" type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
                  <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="resigned">Resigned</option>
                  </select>
                  <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={editForm.department_id} onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}>
                    <option value="">Department*</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={editForm.designation_id} onChange={(e) => setEditForm({ ...editForm, designation_id: e.target.value })}>
                    <option value="">Designation*</option>
                    {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <Input placeholder="Emergency Contact" value={editForm.emergency_contact} onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })} />
                  <div className="md:col-span-3">
                    <Input placeholder="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <Button onClick={saveEdit} className="bg-blue-600 text-white hover:bg-blue-700">
                      <Save className="mr-2 h-4 w-4" />
                      Update Employee
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {showDeptManager && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <h4 className="mb-3 font-semibold text-slate-800">Department Manager</h4>
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Department Name*"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  />
                  <Input
                    placeholder="Code (optional)"
                    value={newDept.code}
                    onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newDept.description}
                    onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  />
                  <div className="md:col-span-3">
                    <Button onClick={createDepartment} className="bg-indigo-600 text-white hover:bg-indigo-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Department
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Name</th>
                        <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Code</th>
                        <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Description</th>
                        <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept) =>
                        editingDepartmentId === dept.id ? (
                          <tr key={dept.id} className="border-t border-slate-100 bg-indigo-50/60">
                            <td className="p-3">
                              <Input value={editDept.name} onChange={(e) => setEditDept({ ...editDept, name: e.target.value })} />
                            </td>
                            <td className="p-3">
                              <Input value={editDept.code} onChange={(e) => setEditDept({ ...editDept, code: e.target.value })} />
                            </td>
                            <td className="p-3">
                              <Input value={editDept.description} onChange={(e) => setEditDept({ ...editDept, description: e.target.value })} />
                            </td>
                            <td className="p-3">
                              <Button size="sm" onClick={saveDepartmentEdit} className="mr-2 bg-indigo-600 text-white hover:bg-indigo-700">
                                <Save className="mr-1 h-4 w-4" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelDepartmentEdit}>
                                <X className="mr-1 h-4 w-4" />
                                Cancel
                              </Button>
                            </td>
                          </tr>
                        ) : (
                          <tr key={dept.id} className="border-t border-slate-100">
                            <td className="p-3 text-sm font-medium text-slate-800">{dept.name}</td>
                            <td className="p-3 text-sm text-slate-600">{dept.code || "—"}</td>
                            <td className="p-3 text-sm text-slate-600">{dept.description || "—"}</td>
                            <td className="p-3">
                              <Button size="sm" variant="outline" onClick={() => startDepartmentEdit(dept)} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                <Pencil className="mr-1 h-4 w-4" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
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
                    <td className="p-4 text-slate-600">{formatDisplayDate(e.date_of_joining)}</td>
                    {isAdmin && (
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => startEdit(e)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
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
          {data && data.items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * (data.per_page || 10) + 1}–
                {Math.min(page * (data.per_page || 10), data.total)} of {data.total} employees
                {data.total_pages > 1 && (
                  <span className="text-slate-400"> · page {page} of {data.total_pages}</span>
                )}
              </p>
              {data.total_pages > 1 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage(page + 1)} className="rounded-lg">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
