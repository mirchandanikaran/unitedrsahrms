# Employee Management System

A production-ready **Employee Management System** for consulting/IT services firms. Manages employees, attendance, leaves, onboarding, self-service profile changes, and executive analytics—with role-based access control and leadership dashboards.

**User guide:** see **[How to use the Employee Management System](docs/HOW_TO_USE.md)** (sign-in, roles, leaves, calendar, onboarding, profile, reporting, date format, and tips).

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Recharts
- **Backend:** Python FastAPI, SQLAlchemy, Pydantic, JWT auth
- **Database:** PostgreSQL (recommended for production). For local dev you can point `DATABASE_URL` at SQLite if configured.

## Features

| Area | Description |
|------|-------------|
| **Employees** | Directory, search, export; **Admin:** add / soft-remove employees |
| **Attendance** | Records, filters, CSV export |
| **Leaves** | Apply with reason; **Managers / Admin / HR:** approve or reject with remarks; balance shows **used**, **pending**, and **total** per type; holidays list |
| **Leave calendar** | Month grid for all roles: **India (IN)** mandatory vs optional holidays + **approved** leaves (updates when leave is approved). **Admin:** add/edit/delete holidays per year |
| **Onboarding** | Template-based checklist (documents, IT, orientation, HR); **Admin/HR:** init for a new hire; employees complete items |
| **My Profile** | View profile; **Employees:** request changes (phone, address, emergency contact, DOB) pending **Admin/HR** approval |
| **Analytics** | Executive KPIs: attrition, diversity, tenure, hiring velocity, utilization, leave liability, attendance trends (Admin, HR, Leadership) |
| **Reports** | CSV exports (employee master, attendance, etc.) |
| **Dashboards** | Role-specific: leadership, manager, employee |
| **Reporting** | **Admin & leadership:** full org hierarchy; **others (with employee profile):** manager chain + direct reports |
| **Date format** | **DD-MMM-YY** everywhere in the UI (e.g. **26-Jan-25**), executive analytics payloads, dashboards, and CSV exports; native `<input type="date">` still uses the browser control |

### Frontend routes (App Router)

| Path | Who typically sees it |
|------|------------------------|
| `/login` | All |
| `/dashboard` | All authenticated roles |
| `/employees` | Admin, HR |
| `/attendance` | Admin, HR |
| `/leaves` | Admin, HR, Manager, Employee |
| `/leave-calendar` | Admin, HR, Manager, Employee, Leadership |
| `/onboarding` | Admin, HR, Employee |
| `/profile` | Admin, HR, Manager, Employee |
| `/reporting` | Admin, HR, Manager, Employee, Leadership |
| `/analytics` | Admin, HR, Leadership |
| `/reports` | Admin, HR |

## Quick Start (Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (or your chosen `DATABASE_URL`)

### 1. Database Setup (PostgreSQL)

```bash
# Create database and user
sudo -u postgres psql -c "CREATE USER hrms_user WITH PASSWORD 'hrms_pass';"
sudo -u postgres psql -c "CREATE DATABASE hrms_db OWNER hrms_user;"
```

Set `DATABASE_URL` in `backend/.env` to match (see `backend/.env.example`).

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit .env
cp .env.example .env

# Seed sample data (creates users, employees, leave types, holidays, onboarding templates, sample leaves)
python scripts/seed_data.py

# Fresh seed includes 5 demo users + 100 random employees (105 rows; random ones have no login).
# To add more random rows on an existing DB:
# python scripts/generate_random_employees.py --count 25

# Run API
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

**Demo logins** (from seed script):

| Role       | Email               | Password    |
|------------|---------------------|-------------|
| Admin      | admin@hrms.com      | password123 |
| HR         | hr@hrms.com         | password123 |
| Manager    | manager@hrms.com    | password123 |
| Employee   | employee@hrms.com   | password123 |
| Leadership | leadership@hrms.com | password123 |

> **Note:** If you re-seed on an existing DB, remove or reset the database first to avoid unique-constraint errors.

### Frontend dev tips (Windows)

If you see Next.js errors like missing chunk files (`Cannot find module './xxx.js'`), stop the dev server, delete `frontend/.next`, and run `npm run dev` again. The app uses static favicon assets under `public/` (e.g. `brand-logo.png`).

### Automated tests

**Backend (pytest)** — from `backend/` after `pip install -r requirements.txt`:

- Tests use **SQLite** automatically (`tests/conftest.py` sets `DATABASE_URL`); you do not need PostgreSQL running.
- **httpx** must be lower than **0.28** for Starlette’s `TestClient` (pinned in `requirements.txt`).

```bash
cd backend
# If a global pytest plugin (e.g. langsmith) breaks collection on your machine:
#   PowerShell: $env:PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
#   bash:       export PYTEST_DISABLE_PLUGIN_AUTOLOAD=1
python -m pytest tests/ -v
```

**Frontend (Vitest + React Testing Library)** — from `frontend/` after `npm install`:

```bash
cd frontend
npm run test:run    # single run (CI)
npm test            # watch mode during development
```

Tests live under `frontend/__tests__/`. Type-check:

```bash
cd frontend
npx tsc --noEmit
```

(`npm run lint` will prompt for first-time ESLint setup until an ESLint config is added.)

---

## Ubuntu Deployment

### 1. Install Dependencies

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv postgresql nginx nodejs npm
```

### 2. Deploy Backend

```bash
sudo mkdir -p /opt/hrms
sudo chown $USER:$USER /opt/hrms
cd /opt/hrms
git clone <your-repo> .
cd backend
python3.11 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with production values
python scripts/seed_data.py
```

### 3. systemd Service

```bash
sudo cp deployment/hrms-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable hrms-backend
sudo systemctl start hrms-backend
```

### 4. Deploy Frontend

```bash
cd /opt/hrms/frontend
npm ci
npm run build
# Run with: npm start (or use PM2)
```

### 5. Nginx

```bash
sudo cp deployment/nginx.conf /etc/nginx/sites-available/hrms
sudo ln -s /etc/nginx/sites-available/hrms /etc/nginx/sites-enabled/
# Edit server_name in nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## Docker (Optional)

```bash
# Backend
cd backend
docker build -t hrms-backend .
docker run -p 8000:8000 --env-file .env hrms-backend

# Frontend (build with NEXT_PUBLIC_API_URL for production)
cd frontend
docker build -t hrms-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://backend:8000 hrms-frontend
```

---

## API Documentation

- **Swagger UI:** http://localhost:8000/docs  
- **ReDoc:** http://localhost:8000/redoc  

Most JSON bodies still use **ISO-8601** dates (`YYYY-MM-DD`); the **web UI** and **CSV exports** use **DD-MMM-YY** as above. Analytics and dashboard period fields return the display format.

### API highlights (prefix `/api/v1`)

- `POST /auth/login` — JWT
- `GET|POST /employees`, `DELETE /employees/{id}`, `GET /employees/me`, `GET /employees/reporting-structure` — directory, self, reporting (org for admin/leadership; personal chain + reports for others)
- `GET|POST /attendance`, bulk mark
- `GET|POST /leaves`, `PUT /leaves/{id}/approve`, `GET /leaves/balance` (includes **pending_days**), `PUT /leaves/balance` (Admin/HR override)
- `GET /leaves/calendar` — month view (`year`, `month`, `region` default `IN`): mandatory/optional holidays + all **approved** leaves
- `GET /leaves/holidays` — optional `year`, `region` (all authenticated)
- `POST|PUT|DELETE /leaves/holidays` — **Admin only** (yearly mandatory/optional holiday maintenance)
- `GET|POST /onboarding/templates`, `POST /onboarding/initialize/{employee_id}`, `GET|PUT /onboarding/items`
- `GET|POST /profile-requests`, `PUT /profile-requests/{id}/review`
- `GET /analytics/executive` — executive suite
- `GET /dashboards/leadership|manager|employee`
- `GET /reports/.../export` — CSV downloads

---

## Roles & Access

| Role       | Access |
|------------|--------|
| **Admin**  | Full control: employees, leave balances, **holiday calendar (CRUD)**, onboarding templates, profile approvals, analytics, reports, **org-wide reporting structure** |
| **HR**     | Employees, leaves (incl. approvals), attendance, reports, onboarding, profile approvals, analytics, **own reporting chain** (view holidays; **admin** edits holiday master) |
| **Manager**| Team leaves (list + approve/reject), own profile, onboarding (as employee), dashboard, **own reporting chain** |
| **Employee** | Own leaves (apply + history + remarks), profile requests, onboarding checklist, **own reporting chain** |
| **Leadership** | Dashboards, executive analytics (read-oriented), **org-wide reporting structure** |

---

## License

Proprietary - Internal Use
