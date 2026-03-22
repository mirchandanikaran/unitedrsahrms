# HRMS - Human Resource Management System

A production-ready HRMS for consulting/IT services firms. Manages employees, attendance, leaves, projects, allocations, and provides leadership dashboards.

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Recharts
- **Backend:** Python FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL

## Quick Start (Development)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL

### 1. Database Setup

```bash
# Create database and user
sudo -u postgres psql -c "CREATE USER hrms_user WITH PASSWORD 'hrms_pass';"
sudo -u postgres psql -c "CREATE DATABASE hrms_db OWNER hrms_user;"
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and edit .env
cp .env.example .env

# Seed sample data
python scripts/seed_data.py

# Run
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

**Demo login:** admin@hrms.com / password123

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

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Roles & Access

| Role     | Access                                              |
|----------|-----------------------------------------------------|
| Admin    | Full control                                        |
| HR       | Employees, leaves, reports, attendance              |
| Manager  | Team view, leave approvals                          |
| Employee | Self-service (profile, leave, projects)             |
| Leadership | Read-only dashboards                             |

---

## License

Proprietary - Internal Use
