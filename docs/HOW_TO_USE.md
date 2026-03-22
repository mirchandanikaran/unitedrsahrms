# Employee Management System — How to use this tool

This guide is for **people using the Employee Management System web portal** (employees, managers, HR, admins, and leadership). For installation and deployment, see the main **[README](../README.md)**.

---

## 1. Getting started

### 1.1 Open the application

- In your browser, go to the URL your organization gives you (for local development this is often **http://localhost:3000**).

### 1.2 Sign in

1. Enter your **work email** and **password**.
2. Click to log in.

If your credentials are wrong or your account is disabled, you will see an error. Contact your **HR** or **IT admin**.

### 1.3 Sign out

- Use **Logout** in the top bar when you finish, especially on a shared computer.

### 1.4 What you see depends on your role

After login, the **left sidebar** only shows menu items you are allowed to use. If you do not see a page (for example **Employees**), your role does not include that access.

### 1.5 Dates in the app

Throughout the portal, **dates are shown as DD-MMM-YY** (for example **26-Jan-25**). Timestamps add a time after the date, e.g. **26-Jan-25, 3:45 PM**. Calendar date pickers still use your browser’s standard control; exported CSV files use the same display format where applicable.

---

## 2. Roles at a glance

| Role | Typical use |
|------|-------------|
| **Employee** | Apply for leave, complete onboarding tasks, update profile (via requests), see your reporting line and the leave calendar. |
| **Manager** | Everything an employee can do, plus **approve or reject** team members’ leave requests. |
| **HR** | Employee directory, attendance, leaves (including approvals), reports, onboarding setup, profile request reviews, analytics, reporting structure (your own). |
| **Admin** | Full HR operations plus **holiday calendar maintenance**, org-wide reporting tree, and sensitive configuration (e.g. leave balance overrides). |
| **Leadership** | High-level dashboards, executive **Analytics**, **org-wide reporting structure**, and **Leave calendar** (no day-to-day leave approval unless also given another role). |

*Exact permissions are configured by your organization.*

---

## 3. Dashboard

- Open **Dashboard** from the sidebar.
- You see **summary widgets** suited to your role (e.g. team pending approvals for a manager, company metrics for leadership).
- Use it as a **home page**; detailed work is done in the other sections.

---

## 4. Leave calendar

**Menu:** **Leave calendar**

### Who can use it

- **Everyone** with access to this menu (including **Leadership**).

### What it shows

- **Month view** (use arrows to change month).
- **Mandatory holidays** (India **IN** region — company / gazetted-style days).
- **Optional holidays** (shown differently in the legend).
- **Approved employee leave** only — names appear on the dates they are approved off.

**Important:** **Pending** leave applications **do not** appear here. After a **manager** (or HR/admin) **approves** the request, it shows on the calendar for everyone (refresh or revisit the month).

### If you are an Admin — maintain the holiday list each year

1. Scroll to **Admin: mandatory & optional holiday calendar**.
2. Choose the **Year**.
3. **Add holiday:** name, date, and whether it is **Mandatory** or optional; save.
4. **Edit** or **Delete** existing rows as needed.

Only **Admin** can add, edit, or delete holidays. **HR** and others can **view** the calendar and holidays but not change the master list.

---

## 5. Leaves

**Menu:** **Leaves**

### 5.1 Employees — apply for leave

1. Check your **leave balance** (including **pending** days still waiting for approval).
2. Choose **leave type**, **start** and **end dates**, and **reason** (required where the form asks for it).
3. Submit the application.
4. Status stays **pending** until a manager or HR/admin acts on it.

### 5.2 Managers / HR / Admin — approve or reject

1. Find the request in the list (you may see **team** or **all** requests depending on role).
2. **Approve** or **Reject**.
3. If you reject, provide a **reason** when prompted so the employee can see why.

### 5.3 Reading the list

- Expand or open **details** where available to see **reason**, **rejection remarks**, and **who approved**.
- After action, balances and the **Leave calendar** update according to the new status.

### 5.4 Holidays list (on Leaves page)

- You can refer to **company holidays** for the year (as configured). The **Leave calendar** is the visual month view.

---

## 6. Onboarding

**Menu:** **Onboarding**

### Employees

1. Open **Onboarding** to see your **checklist** (documents, IT, orientation, HR tasks, etc.).
2. Work through items and mark them **complete** when instructed.
3. Add **notes** if the form allows.

### HR / Admin

1. Manage **templates** (checklist definitions) if your process includes that.
2. **Initialize** onboarding for a **new hire** (select the employee) so their checklist appears for them.

*Exact buttons depend on your build; if something is missing, ask HR.*

---

## 7. My Profile

**Menu:** **My Profile**

### Viewing your profile

- See your name, code, email, department, designation, and related details.

### Requesting changes (e.g. phone, address)

1. Choose the **field** you want to change and enter the **new value**.
2. Submit the **request**.
3. Wait for **HR** or **Admin** to **approve** or **reject**.

### HR / Admin

- Review **pending** profile update requests on the same page and **approve** or **reject** as appropriate.

---

## 8. Reporting (org chart / line manager)

**Menu:** **Reporting**

### Most users (Employee, Manager, HR)

- See **who you report to** (chain upward).
- See your **direct reports** (if any).

### Admin and Leadership

- See the **full organization** reporting structure (expandable tree / search).

Use this to understand **escalation** and **who approves leave** in your chain.

---

## 9. Employees & attendance (HR / Admin)

### Employees

**Menu:** **Employees**

- Search and browse the directory.
- **Admin / HR:** add employees, update records, or **soft-remove** (deactivate) as per policy.

### Attendance

**Menu:** **Attendance**

- View and filter attendance records.
- **Export** or bulk operations as your organization enables.

---

## 10. Analytics & reports (HR / Admin / Leadership)

### Analytics

**Menu:** **Analytics** (Admin, HR, Leadership)

- Executive-style metrics: headcount, attrition, diversity, tenure, hiring, utilization, leave liability, attendance trends, etc.
- Use filters or date ranges if the screen provides them.

### Reports

**Menu:** **Reports** (Admin, HR)

- Download **CSV** exports (e.g. employee master, attendance) with filters where available.

---

## 11. Tips & good practice

| Topic | Suggestion |
|-------|------------|
| **Leave** | Apply early; check **Leave calendar** for holidays and team visibility after approval. |
| **Rejections** | Managers should always add a **clear rejection reason**. |
| **Profile** | Do not expect instant updates — wait for HR/Admin approval. |
| **Security** | Log out on shared PCs; do not share passwords. |
| **Browser** | Use a current browser; if the page looks broken, try a hard refresh or another browser. |

---

## 12. Demo accounts (local / training only)

If your environment was seeded with sample data, training accounts often look like this (password is usually **`password123`** — change in production):

| Role | Email |
|------|--------|
| Admin | `admin@hrms.com` |
| HR | `hr@hrms.com` |
| Manager | `manager@hrms.com` |
| Employee | `employee@hrms.com` |
| Leadership | `leadership@hrms.com` |

*Your real organization will use different emails.*

---

## 13. Further technical documentation

- **API reference (Swagger):** `http://<your-api-host>:8000/docs` (when the backend is running).
- **Developers:** see **[README](../README.md)** for environment variables, database, and deployment.

---

## 14. Need help?

- **Access or role issues** → HR or IT admin.  
- **Wrong pay / policy** → HR; the tool only reflects what is configured.  
- **Bugs** → IT or the team that maintains the Employee Management System.

*Document version: aligned with Employee Management System features described in the project README.*
