const API_BASE = "/api/v1";

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...rest } = options;
  let url = `${API_BASE}${path}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    url += (url.includes("?") ? "&" : "?") + search;
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...rest, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  employees: {
    list: (params?: Record<string, string>) => request<Paginated<Employee>>("/employees", { params }),
    get: (id: number) => request<Employee>(`/employees/${id}`),
    me: () => request<Employee>("/employees/me"),
    create: (data: Partial<Employee>) =>
      request<Employee>("/employees", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Employee>) =>
      request<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) =>
      request<{ message: string; employee_id: number }>(`/employees/${id}`, { method: "DELETE" }),
    departments: () => request<Department[]>("/employees/departments"),
    designations: () => request<Designation[]>("/employees/designations"),
  },
  attendance: {
    list: (params?: Record<string, string>) =>
      request<Paginated<Attendance>>("/attendance", { params }),
    bulkCreate: (data: { date: string; records: { employee_id: number; status: string }[] }) =>
      request("/attendance/bulk", { method: "POST", body: JSON.stringify(data) }),
  },
  leaves: {
    list: (params?: Record<string, string>) => request<Paginated<Leave>>("/leaves", { params }),
    balance: (params?: Record<string, string>) => request<LeaveBalance[]>("/leaves/balance", { params }),
    create: (data: Partial<Leave>) =>
      request<Leave>("/leaves", { method: "POST", body: JSON.stringify(data) }),
    approve: (id: number, data: { status: string; rejection_reason?: string }) =>
      request<Leave>(`/leaves/${id}/approve`, { method: "PUT", body: JSON.stringify(data) }),
    types: () => request<LeaveType[]>("/leaves/types"),
    holidays: (year?: number) =>
      request<Holiday[]>("/leaves/holidays", { params: year ? { year: String(year) } : {} }),
    updateBalance: (data: { employee_id: number; leave_type_id: number; total_days: number; year?: number }) =>
      request<{ message: string }>("/leaves/balance", { method: "PUT", body: JSON.stringify(data) }),
  },
  projects: {
    list: (params?: Record<string, string>) => request<Paginated<Project>>("/projects", { params }),
    allocations: (params?: Record<string, string>) =>
      request<Paginated<Allocation>>("/projects/allocations/list", { params }),
    create: (data: Partial<Project>) =>
      request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  },
  dashboards: {
    leadership: (params?: Record<string, string>) =>
      request<LeadershipDashboard>("/dashboards/leadership", { params }),
    manager: (params?: Record<string, string>) =>
      request<ManagerDashboard>("/dashboards/manager", { params }),
    employee: (params?: Record<string, string>) =>
      request<EmployeeDashboard>("/dashboards/employee", { params }),
  },
  reports: {
    employeeMaster: (params?: Record<string, string>) =>
      fetch(`${API_BASE}/reports/employee-master/export?${new URLSearchParams(params || {}).toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then((r) => r.blob()),
    attendance: (params: Record<string, string>) =>
      fetch(`${API_BASE}/reports/attendance/export?${new URLSearchParams(params).toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).then((r) => r.blob()),
  },
  notifications: {
    list: (params?: Record<string, string>) =>
      request<Notification[]>("/notifications", { params }),
    markRead: (id: number) =>
      request(`/notifications/${id}/read`, { method: "PUT" }),
  },
};

// Types
export interface User {
  id: number;
  email: string;
  role: string;
  employee_id?: number;
  name?: string;
}
export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: number;
  designation_id: number;
  department?: Department;
  designation?: Designation;
  status: string;
  date_of_joining: string;
}
export interface Department {
  id: number;
  name: string;
  code?: string;
}
export interface Designation {
  id: number;
  name: string;
}
export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  employee_name?: string;
}
export interface Leave {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  employee_name?: string;
  leave_type_name?: string;
}
export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  total_days: number;
  used_days: number;
  balance: number;
}
export interface LeaveType {
  id: number;
  name: string;
  code?: string;
}
export interface Holiday {
  id: number;
  name: string;
  date: string;
  year: number;
}
export interface Project {
  id: number;
  name: string;
  code?: string;
  status: string;
}
export interface Allocation {
  id: number;
  employee_id: number;
  project_id: number;
  allocation_percent: number;
  is_billable: number;
  employee_name?: string;
  project_name?: string;
}
export interface Notification {
  id: number;
  title: string;
  message?: string;
  is_read: number;
  created_at: string;
}
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
export interface LeadershipDashboard {
  headcount: { total: number; active: number; inactive: number };
  department_headcount: { name: string; count: number }[];
  attendance_summary: { present: number; absent: number };
  utilization: { utilization_percent: number; billable_allocation: number };
  new_joiners: number;
  exits: number;
}
export interface ManagerDashboard {
  team_utilization: number;
  pending_leave_approvals: number;
  team_attendance_count?: number;
}
export interface EmployeeDashboard {
  attendance: { present_days: number; absent_days: number };
}
