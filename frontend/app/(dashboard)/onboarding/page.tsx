"use client";

import { useEffect, useState } from "react";
import { api, OnboardingTemplate, OnboardingItem } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, CheckCircle2, Circle, Plus, Trash2, Play } from "lucide-react";

const CATEGORIES: Record<string, { label: string; color: string }> = {
  documents: { label: "Documents", color: "bg-blue-500" },
  it_setup: { label: "IT Setup", color: "bg-indigo-500" },
  orientation: { label: "Orientation", color: "bg-sky-500" },
  hr_formalities: { label: "HR Formalities", color: "bg-violet-500" },
};

export default function OnboardingPage() {
  const { user } = useAuthStore();
  const isAdmin = ["admin", "hr"].includes(user?.role || "");
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [empId, setEmpId] = useState("");
  const [newTemplate, setNewTemplate] = useState({ title: "", category: "documents", description: "" });
  const [viewEmpId, setViewEmpId] = useState("");

  useEffect(() => {
    if (isAdmin) api.onboarding.templates().then(setTemplates).catch(console.error);
    api.onboarding.items().then(setItems).catch(console.error);
  }, []);

  const loadItems = (eid?: string) => {
    const params: Record<string, string> = {};
    if (eid) params.employee_id = eid;
    api.onboarding.items(params).then(setItems).catch(console.error);
  };

  const initOnboarding = async () => {
    if (!empId) return alert("Enter Employee ID");
    try {
      await api.onboarding.initialize(Number(empId));
      loadItems(empId);
      setViewEmpId(empId);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.title) return;
    try {
      await api.onboarding.createTemplate({ ...newTemplate, order: templates.length + 1 });
      api.onboarding.templates().then(setTemplates);
      setNewTemplate({ title: "", category: "documents", description: "" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const toggleItem = async (item: OnboardingItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      await api.onboarding.updateItem(item.id, { status: newStatus });
      loadItems(viewEmpId || undefined);
    } catch (e) {
      console.error(e);
    }
  };

  const grouped = items.reduce<Record<string, OnboardingItem[]>>((acc, item) => {
    const cat = item.template_category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === "completed").length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
          <ClipboardList className="h-5 w-5" />
        </div>
        Onboarding
      </h1>

      {isAdmin && (
        <>
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="pt-6">
              <h2 className="mb-3 font-semibold text-slate-800">Initialize Onboarding for New Hire</h2>
              <div className="flex gap-3">
                <Input placeholder="Employee ID" value={empId} onChange={(e) => setEmpId(e.target.value)} className="max-w-[200px]" />
                <Button onClick={initOnboarding} className="bg-indigo-600 text-white hover:bg-indigo-700">
                  <Play className="mr-1 h-4 w-4" /> Initialize
                </Button>
                <Input placeholder="View Employee ID" value={viewEmpId} onChange={(e) => setViewEmpId(e.target.value)} className="max-w-[200px]" />
                <Button variant="outline" onClick={() => loadItems(viewEmpId)}>View Checklist</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="pt-6">
              <h2 className="mb-3 font-semibold text-slate-800">Manage Templates ({templates.length})</h2>
              <div className="flex gap-3 mb-4">
                <Input placeholder="Task title" value={newTemplate.title} onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })} />
                <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={newTemplate.category} onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <Button onClick={addTemplate} className="bg-blue-600 text-white hover:bg-blue-700 shrink-0">
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              <div className="space-y-1">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${CATEGORIES[t.category]?.color || "bg-gray-400"}`} />
                      <span className="text-sm text-slate-700">{t.title}</span>
                      <span className="text-xs text-slate-400">{CATEGORIES[t.category]?.label}</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-red-500 border-red-200 hover:bg-red-50" onClick={async () => {
                      await api.onboarding.deleteTemplate(t.id);
                      api.onboarding.templates().then(setTemplates);
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {totalItems > 0 && (
        <>
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-800">Progress</h2>
                <span className="text-sm font-medium text-slate-600">{completedItems}/{totalItems} completed</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>

          {Object.entries(grouped).map(([cat, catItems]) => (
            <Card key={cat} className="border-0 shadow-lg shadow-slate-200/50">
              <CardContent className="pt-6">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <span className={`h-3 w-3 rounded-full ${CATEGORIES[cat]?.color || "bg-gray-400"}`} />
                  {CATEGORIES[cat]?.label || cat}
                </h3>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-blue-50/50"
                    >
                      {item.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                      )}
                      <span className={`text-sm ${item.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {item.template_title}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {totalItems === 0 && !isAdmin && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16">
            <ClipboardList className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500">No onboarding tasks assigned</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
