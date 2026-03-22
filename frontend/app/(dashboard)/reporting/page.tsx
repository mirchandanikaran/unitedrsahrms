"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ReportingNode, ReportingStructure } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GitBranch, ChevronDown, ChevronRight, User, Building2 } from "lucide-react";

type TreeNode = ReportingNode & { children: TreeNode[] };

function buildForest(nodes: ReportingNode[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  for (const n of nodes) {
    map.set(n.id, { ...n, children: [] });
  }
  const roots: TreeNode[] = [];
  const ids = new Set(nodes.map((n) => n.id));
  for (const n of nodes) {
    const node = map.get(n.id)!;
    if (n.manager_id != null && ids.has(n.manager_id)) {
      map.get(n.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortRec = (r: TreeNode) => {
    r.children.sort((a, b) => a.employee_code.localeCompare(b.employee_code));
    r.children.forEach(sortRec);
  };
  roots.sort((a, b) => a.employee_code.localeCompare(b.employee_code));
  roots.forEach(sortRec);
  return roots;
}

function filterForest(forest: TreeNode[], q: string): TreeNode[] {
  const lower = q.trim().toLowerCase();
  if (!lower) return forest;
  const keep = (n: TreeNode): TreeNode | null => {
    const selfMatch =
      `${n.first_name} ${n.last_name}`.toLowerCase().includes(lower) ||
      n.employee_code.toLowerCase().includes(lower) ||
      n.email.toLowerCase().includes(lower) ||
      (n.department || "").toLowerCase().includes(lower);
    const kids = n.children.map(keep).filter(Boolean) as TreeNode[];
    if (selfMatch || kids.length) {
      return { ...n, children: kids };
    }
    return null;
  };
  return forest.map(keep).filter(Boolean) as TreeNode[];
}

function OrgTreeRow({
  node,
  depth,
  defaultOpen,
}: {
  node: TreeNode;
  depth: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasKids = node.children.length > 0;
  return (
    <div className="select-none">
      <div
        className="flex items-center gap-1 rounded-lg py-1.5 pr-2 hover:bg-slate-50"
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {hasKids ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
            aria-expanded={open}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="inline-block w-7" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">
            {node.first_name} {node.last_name}
            <span className="ml-2 font-normal text-slate-500">{node.employee_code}</span>
          </p>
          <p className="truncate text-xs text-slate-500">
            {node.designation || "—"}
            {node.department ? ` · ${node.department}` : ""}
            {node.status !== "active" ? ` · ${node.status}` : ""}
          </p>
        </div>
      </div>
      {hasKids && open && (
        <div>
          {node.children.map((c) => (
            <OrgTreeRow key={c.id} node={c} depth={depth + 1} defaultOpen={depth < 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportingPage() {
  const [data, setData] = useState<ReportingStructure | null>(null);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.employees
      .reportingStructure()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const forest = useMemo(() => (data?.nodes?.length ? buildForest(data.nodes) : []), [data]);
  const filtered = useMemo(() => filterForest(forest, search), [forest, search]);

  const isOrg = data?.scope === "organization";

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <GitBranch className="h-5 w-5" />
        </div>
        Reporting structure
      </h1>
      <p className="text-sm text-slate-600">
        {isOrg
          ? "Organization-wide reporting lines (admin & leadership)."
          : "Your manager chain and direct reports. HR and managers see the same personal view unless they have admin or leadership access."}
      </p>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-sm text-red-800">{err}</CardContent>
        </Card>
      )}

      {data && !isOrg && data.focus_employee_id != null && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="pt-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Building2 className="h-4 w-4" />
                Reports to
              </h2>
              {(data.reports_to_chain || []).length === 0 ? (
                <p className="text-sm text-slate-500">No manager assigned (top of chain).</p>
              ) : (
                <ol className="space-y-3">
                  {(data.reports_to_chain || []).map((m, i) => (
                    <li key={m.id} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">
                          {m.first_name} {m.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {m.designation}
                          {m.department ? ` · ${m.department}` : ""} · {m.employee_code}
                        </p>
                        <p className="text-xs text-slate-400">{m.email}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="pt-6">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <User className="h-4 w-4" />
                Direct reports
              </h2>
              {(data.direct_reports || []).length === 0 ? (
                <p className="text-sm text-slate-500">No direct reports.</p>
              ) : (
                <ul className="space-y-3">
                  {(data.direct_reports || []).map((r) => (
                    <li key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {r.first_name} {r.last_name}{" "}
                        <span className="font-normal text-slate-500">{r.employee_code}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.designation}
                        {r.department ? ` · ${r.department}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">{r.email}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {data && isOrg && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Full organization tree</h2>
              <Input
                placeholder="Search name, code, email, department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="max-h-[min(70vh,720px)] overflow-auto rounded-xl border border-slate-100 bg-white p-2">
              {filtered.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">No matches.</p>
              ) : (
                filtered.map((root) => <OrgTreeRow key={root.id} node={root} depth={0} defaultOpen />)
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
