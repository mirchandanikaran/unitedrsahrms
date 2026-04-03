const API_BASE = "/api/v1";

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const err = payload as { detail?: unknown; message?: unknown };
  if (typeof err.message === "string" && err.message.trim()) return err.message;
  if (typeof err.detail === "string" && err.detail.trim()) return err.detail;

  if (Array.isArray(err.detail) && err.detail.length > 0) {
    const first = err.detail[0];
    if (typeof first === "string" && first.trim()) return first;
    if (first && typeof first === "object") {
      const firstObj = first as { msg?: unknown; loc?: unknown };
      if (typeof firstObj.msg === "string" && firstObj.msg.trim()) {
        const loc =
          Array.isArray(firstObj.loc) && firstObj.loc.length
            ? `${firstObj.loc.join(".")}: `
            : "";
        return `${loc}${firstObj.msg}`;
      }
    }
  }

  if (err.detail && typeof err.detail === "object") {
    const detailObj = err.detail as { message?: unknown; error?: unknown };
    if (typeof detailObj.message === "string" && detailObj.message.trim()) return detailObj.message;
    if (typeof detailObj.error === "string" && detailObj.error.trim()) return detailObj.error;
  }

  return fallback;
}

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
    const err = await res.json().catch(() => ({}));
    const message = extractErrorMessage(err, "Unauthorized");
    // Keep users on login page for bad credentials instead of forced reload.
    if (path !== "/auth/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error(message);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(extractErrorMessage(err, `HTTP ${res.status}`));
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
    createDepartment: (data: { name: string; code?: string; description?: string }) =>
      request<Department>("/employees/departments", { method: "POST", body: JSON.stringify(data) }),
    updateDepartment: (id: number, data: { name?: string; code?: string; description?: string }) =>
      request<Department>(`/employees/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    designations: () => request<Designation[]>("/employees/designations"),
    reportingStructure: () => request<ReportingStructure>("/employees/reporting-structure"),
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
    holidays: (params?: Record<string, string>) =>
      request<Holiday[]>("/leaves/holidays", { params: params || {} }),
    calendar: (year: number, month: number, region = "IN") =>
      request<LeaveCalendarMonth>("/leaves/calendar", {
        params: { year: String(year), month: String(month), region },
      }),
    createHoliday: (data: {
      name: string;
      date: string;
      year: number;
      is_optional?: number;
      region?: string | null;
    }) => request<Holiday>("/leaves/holidays", { method: "POST", body: JSON.stringify(data) }),
    updateHoliday: (
      id: number,
      data: Partial<{ name: string; date: string; year: number; is_optional: number; region: string | null }>
    ) => request<Holiday>(`/leaves/holidays/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteHoliday: (id: number) => request<{ message: string }>(`/leaves/holidays/${id}`, { method: "DELETE" }),
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
  onboarding: {
    templates: () => request<OnboardingTemplate[]>("/onboarding/templates"),
    createTemplate: (data: { title: string; category: string; description?: string; order?: number }) =>
      request<OnboardingTemplate>("/onboarding/templates", { method: "POST", body: JSON.stringify(data) }),
    deleteTemplate: (id: number) =>
      request<{ message: string }>(`/onboarding/templates/${id}`, { method: "DELETE" }),
    initialize: (employeeId: number) =>
      request<{ message: string }>(`/onboarding/initialize/${employeeId}`, { method: "POST" }),
    items: (params?: Record<string, string>) =>
      request<OnboardingItem[]>("/onboarding/items", { params }),
    updateItem: (id: number, data: { status?: string; notes?: string }) =>
      request<OnboardingItem>(`/onboarding/items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },
  profileRequests: {
    create: (data: { field_name: string; new_value: string }) =>
      request<ProfileUpdateRequest>("/profile-requests", { method: "POST", body: JSON.stringify(data) }),
    list: (params?: Record<string, string>) =>
      request<ProfileUpdateRequest[]>("/profile-requests", { params }),
    review: (id: number, data: { status: string; rejection_reason?: string }) =>
      request<ProfileUpdateRequest>(`/profile-requests/${id}/review`, { method: "PUT", body: JSON.stringify(data) }),
  },
  analytics: {
    executive: (params?: Record<string, string>) =>
      request<ExecutiveAnalytics>("/analytics/executive", { params }),
  },
  social: {
    listPosts: (params?: Record<string, string>) =>
      request<Paginated<SocialPost>>("/social/posts", { params }),
    createPost: (data: { content: string }) =>
      request<SocialPost>("/social/posts", { method: "POST", body: JSON.stringify(data) }),
    deletePost: (id: number) =>
      request<{ message: string; id: number }>(`/social/posts/${id}`, { method: "DELETE" }),
    toggleLike: (postId: number) =>
      request<{ liked: boolean; like_count: number }>(`/social/posts/${postId}/like`, { method: "POST" }),
    addComment: (postId: number, data: { content: string }) =>
      request<SocialComment>(`/social/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(data) }),
    deleteComment: (id: number) =>
      request<{ message: string; id: number }>(`/social/comments/${id}`, { method: "DELETE" }),
  },
  awards: {
    list: (params?: Record<string, string>) =>
      request<AwardBadge[]>("/awards", { params }),
    create: (data: {
      employee_id: number;
      title: string;
      badge_type?: string;
      description?: string;
      awarded_on?: string;
    }) => request<AwardBadge>("/awards", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: number) =>
      request<{ message: string; id: number }>(`/awards/${id}`, { method: "DELETE" }),
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
  phone?: string;
  address?: string;
  emergency_contact?: string;
  date_of_birth?: string;
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
  description?: string;
}
export interface Designation {
  id: number;
  name: string;
}
export interface ReportingNode {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  designation?: string;
  manager_id: number | null;
  status: string;
}
export interface ReportingStructure {
  scope: "self" | "organization";
  nodes: ReportingNode[];
  focus_employee_id?: number | null;
  reports_to_chain?: ReportingNode[] | null;
  direct_reports?: ReportingNode[] | null;
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
  reason?: string;
  status: string;
  approved_by_id?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at?: string;
  employee_name?: string;
  leave_type_name?: string;
}
export interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  total_days: number;
  used_days: number;
  pending_days: number;
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
  is_optional?: number;
  region?: string | null;
}
export interface CalendarHolidayItem {
  id: number;
  name: string;
  is_optional: number;
  region?: string | null;
}
export interface CalendarLeaveItem {
  leave_id: number;
  employee_id: number;
  employee_name: string;
  leave_type_name: string;
  is_self: boolean;
}
export interface CalendarDay {
  date: string;
  mandatory_holidays: CalendarHolidayItem[];
  optional_holidays: CalendarHolidayItem[];
  approved_leaves: CalendarLeaveItem[];
}
export interface LeaveCalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
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
  attendance_summary: {
    present: number;
    absent: number;
    period_start?: string;
    period_end?: string;
  };
  leave_trends?: { total_leave_days: number };
  utilization: {
    utilization_percent: number;
    billable_allocation: number;
    total_allocation?: number;
  };
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
export interface OnboardingTemplate {
  id: number;
  title: string;
  category: string;
  description?: string;
  order: number;
}
export interface OnboardingItem {
  id: number;
  template_id: number;
  employee_id: number;
  status: string;
  completed_at?: string;
  completed_by_id?: number;
  notes?: string;
  created_at: string;
  template_title?: string;
  template_category?: string;
}
export interface ProfileUpdateRequest {
  id: number;
  employee_id: number;
  field_name: string;
  old_value?: string;
  new_value: string;
  status: string;
  reviewed_by_id?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  employee_name?: string;
}
export interface ExecutiveAnalytics {
  headcount: { active: number; inactive: number; total: number };
  attrition: { rate_percent: number; exits_in_period: number; monthly: { month: string; exits: number; joins: number }[] };
  department_diversity: { name: string; count: number; percent: number }[];
  designation_diversity: { name: string; count: number }[];
  tenure_distribution: { bucket: string; count: number }[];
  hiring_velocity: { month: string; hires: number }[];
  utilization: { total_allocation: number; billable_allocation: number; utilization_percent: number };
  leave_liability: { total_liability_days: number; by_type: { type: string; total_entitled: number; total_used: number; remaining_liability: number }[] };
  attendance_trends: { date: string; present: number; absent: number }[];
  pending_leaves: number;
}
export interface AwardBadge {
  id: number;
  employee_id: number;
  employee_name: string;
  title: string;
  badge_type: string;
  description?: string;
  awarded_on: string;
  awarded_by_id?: number;
  awarded_by_name?: string;
  created_at: string;
}
export interface SocialComment {
  id: number;
  post_id: number;
  employee_id: number;
  employee_name: string;
  content: string;
  created_at: string;
  can_delete: boolean;
}
export interface SocialPost {
  id: number;
  employee_id: number;
  employee_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  is_liked_by_me: boolean;
  can_delete: boolean;
  comments: SocialComment[];
}
