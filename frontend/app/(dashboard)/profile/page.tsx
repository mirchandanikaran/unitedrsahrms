"use client";

import { useEffect, useState } from "react";
import { api, Employee, ProfileUpdateRequest } from "@/lib/api";
import { formatDisplayDate } from "@/lib/dateFormat";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle, Send, Check, X, Clock } from "lucide-react";

const EDITABLE_FIELDS = [
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "emergency_contact", label: "Emergency Contact" },
  { key: "date_of_birth", label: "Date of Birth" },
];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const isAdmin = ["admin", "hr"].includes(user?.role || "");
  const [profile, setProfile] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>([]);
  const [editField, setEditField] = useState("");
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    api.employees.me().then(setProfile).catch(console.error);
    loadRequests();
  }, []);

  const loadRequests = () => {
    const params: Record<string, string> = {};
    if (isAdmin) params.status_filter = "pending";
    api.profileRequests.list(params).then(setRequests).catch(console.error);
  };

  const submitRequest = async () => {
    if (!editField || !editValue) return alert("Select a field and enter new value");
    try {
      await api.profileRequests.create({ field_name: editField, new_value: editValue });
      setEditField("");
      setEditValue("");
      loadRequests();
      alert("Update request submitted for approval.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const reviewRequest = async (id: number, status: string) => {
    try {
      await api.profileRequests.review(id, { status });
      loadRequests();
      if (status === "approved") api.employees.me().then(setProfile).catch(console.error);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
          <UserCircle className="h-5 w-5" />
        </div>
        My Profile
      </h1>

      {profile && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white">
                {profile.first_name[0]}{profile.last_name[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{profile.first_name} {profile.last_name}</h2>
                <p className="text-sm text-slate-500">{profile.employee_code} &middot; {profile.email}</p>
                <p className="text-sm text-slate-500">{profile.department?.name} &middot; {profile.designation?.name}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400 mb-1">Phone</p>
                <p className="text-sm font-medium text-slate-700">{profile.phone || "—"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400 mb-1">Address</p>
                <p className="text-sm font-medium text-slate-700">{profile.address || "—"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400 mb-1">Emergency Contact</p>
                <p className="text-sm font-medium text-slate-700">{profile.emergency_contact || "—"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-400 mb-1">Date of Joining</p>
                <p className="text-sm font-medium text-slate-700">{formatDisplayDate(profile.date_of_joining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-3 font-semibold text-slate-800">Request Profile Update</h2>
            <p className="mb-3 text-sm text-slate-500">Changes will be sent for admin/HR approval before being applied.</p>
            <div className="flex gap-3 flex-wrap">
              <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={editField} onChange={(e) => setEditField(e.target.value)}>
                <option value="">Select field...</option>
                {EDITABLE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <Input placeholder="New value" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="max-w-sm" />
              <Button onClick={submitRequest} className="bg-sky-600 text-white hover:bg-sky-700">
                <Send className="mr-1 h-4 w-4" /> Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length > 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <h2 className="mb-4 font-semibold text-slate-800">
              {isAdmin ? "Pending Profile Update Requests" : "My Update Requests"}
            </h2>
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                  <div>
                    {isAdmin && <p className="text-sm font-semibold text-slate-800">{r.employee_name}</p>}
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">{r.field_name}</span>: {r.old_value || "—"} → <span className="font-semibold text-blue-600">{r.new_value}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {r.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock className="h-3 w-3" /> Pending</span>
                      ) : r.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> Approved</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600"><X className="h-3 w-3" /> Rejected</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewRequest(r.id, "approved")} className="bg-green-500 text-white hover:bg-green-600 rounded-lg">
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewRequest(r.id, "rejected")} className="border-red-200 text-red-600 hover:bg-red-50 rounded-lg">
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
