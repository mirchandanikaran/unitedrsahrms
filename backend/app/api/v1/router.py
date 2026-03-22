"""API v1 router - mounts all endpoints."""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, employees, attendance, leaves, projects, dashboards, reports, performance, notifications

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(attendance.router)
api_router.include_router(leaves.router)
api_router.include_router(projects.router)
api_router.include_router(dashboards.router)
api_router.include_router(reports.router)
api_router.include_router(performance.router)
api_router.include_router(notifications.router)
