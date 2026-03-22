"use client";

import { useEffect, useState } from "react";
import { api, Project, Paginated } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Paginated<Project> | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.projects.list({ page: String(page), per_page: "10" }).then(setProjects).catch(console.error);
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <FolderKanban className="h-5 w-5" />
        </div>
        Projects
      </h1>

      <Card className="overflow-hidden border-0 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Name</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Code</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects?.items.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{p.name}</td>
                    <td className="p-4 text-slate-600">{p.code || "-"}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                          p.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!projects?.items.length && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-500">
              <FolderKanban className="h-12 w-12 text-slate-300" />
              <p>No projects</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
