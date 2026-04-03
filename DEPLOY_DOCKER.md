# HRMS Docker Deployment (Fresh Start)

This deploys the full stack on one server:

- PostgreSQL
- FastAPI backend
- Next.js frontend
- Nginx reverse proxy (port 80)

## 1) Prerequisites

- Ubuntu server with Docker and Docker Compose plugin installed
- Ports open: `80` (and optionally `443` if you add TLS later)

Install Docker on Ubuntu (if needed):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
```

## 2) Clone and configure env

```bash
git clone <your-repo-url>
cd HRMS
cp deployment/docker.env.example deployment/docker.env
```

Edit `deployment/docker.env`:

- set strong `POSTGRES_PASSWORD`
- set strong `SECRET_KEY`
- set `CORS_ORIGINS` for your domain/IP

## 3) Build and run

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
docker compose logs -f backend
```

## 4) First-time onboarding (empty database)

Open your server URL in browser (or `http://<server-ip>`).

- The app redirects to `/setup`
- Create first admin user
- Complete initialization

After setup, log in with the new admin account.

## 5) Useful operations

Restart all:

```bash
docker compose restart
```

Stop:

```bash
docker compose down
```

Stop + remove database data (full reset):

```bash
docker compose down -v
```

Update after pulling new code:

```bash
git pull
docker compose up -d --build
```
