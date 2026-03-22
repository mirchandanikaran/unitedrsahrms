"""Dashboard endpoints - Leadership, Manager, Employee."""
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract

from app.api.deps import get_db, get_leadership_or_above, get_manager_or_above, get_current_user
from app.utils.date_display import format_display_date
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.project import Project, Allocation
from app.models.user import RoleEnum

router = APIRouter(prefix="/dashboards", tags=["dashboards"])


def _leadership_dashboard(db: Session, start_date: date, end_date: date) -> dict:
    # Headcount
    total = db.query(func.count(Employee.id)).filter(Employee.status == "active").scalar() or 0
    inactive = db.query(func.count(Employee.id)).filter(Employee.status != "active").scalar() or 0

    # Department-wise (with names)
    from app.models.employee import Department
    dept_counts = (
        db.query(Department.name, func.count(Employee.id))
        .join(Employee, Employee.department_id == Department.id)
        .filter(Employee.status == "active")
        .group_by(Department.id, Department.name)
        .all()
    )
    dept_headcount = [{"name": r[0], "count": r[1]} for r in dept_counts]

    # Attendance summary
    present = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status.in_(["present", "wfh", "half_day"]),
        )
        .scalar()
        or 0
    )
    absent = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status == "absent",
        )
        .scalar()
        or 0
    )

    # Leave trends
    leaves_approved = (
        db.query(func.coalesce(func.sum(Leave.days), 0))
        .filter(
            Leave.start_date >= start_date,
            Leave.end_date <= end_date,
            Leave.status == "approved",
        )
        .scalar()
        or 0
    )

    # Utilization
    total_alloc = (
        db.query(func.coalesce(func.sum(Allocation.allocation_percent), 0))
        .join(Employee, Allocation.employee_id == Employee.id)
        .filter(Employee.status == "active")
        .filter(or_(Allocation.end_date.is_(None), Allocation.end_date >= date.today()))
        .scalar()
        or 0
    )
    billable_alloc = (
        db.query(func.coalesce(func.sum(Allocation.allocation_percent), 0))
        .join(Employee, Allocation.employee_id == Employee.id)
        .filter(Employee.status == "active", Allocation.is_billable == 1)
        .filter(or_(Allocation.end_date.is_(None), Allocation.end_date >= date.today()))
        .scalar()
        or 0
    )
    utilization_pct = (billable_alloc / total_alloc * 100) if total_alloc > 0 else 0

    # New joiners vs exits (current month)
    month_start = date.today().replace(day=1)
    new_joiners = (
        db.query(func.count(Employee.id))
        .filter(Employee.date_of_joining >= month_start, Employee.status == "active")
        .scalar()
        or 0
    )
    exits = (
        db.query(func.count(Employee.id))
        .filter(Employee.exit_date >= month_start, Employee.exit_date.isnot(None))
        .scalar()
        or 0
    )

    return {
        "headcount": {"total": total, "active": total, "inactive": inactive},
        "department_headcount": dept_headcount,
        "attendance_summary": {
            "period_start": format_display_date(start_date),
            "period_end": format_display_date(end_date),
            "present": present,
            "absent": absent,
        },
        "leave_trends": {"total_leave_days": float(leaves_approved)},
        "utilization": {
            "total_allocation": float(total_alloc),
            "billable_allocation": float(billable_alloc),
            "utilization_percent": round(utilization_pct, 2),
        },
        "new_joiners": new_joiners,
        "exits": exits,
    }


def _manager_dashboard(db: Session, manager_id: int, start_date: date, end_date: date) -> dict:
    reports_ids = [
        r[0] for r in db.query(Employee.id).filter(Employee.manager_id == manager_id).all()
    ]
    if not reports_ids:
        return {
            "team_attendance": [],
            "team_utilization": 0,
            "pending_leave_approvals": 0,
        }

    team_att = (
        db.query(Attendance.employee_id, Attendance.date, Attendance.status)
        .filter(
            Attendance.employee_id.in_(reports_ids),
            Attendance.date >= start_date,
            Attendance.date <= end_date,
        )
        .all()
    )

    pending_leaves = (
        db.query(func.count(Leave.id))
        .filter(Leave.employee_id.in_(reports_ids), Leave.status == "pending")
        .scalar()
        or 0
    )

    total_alloc = (
        db.query(func.coalesce(func.sum(Allocation.allocation_percent), 0))
        .filter(
            Allocation.employee_id.in_(reports_ids),
            or_(Allocation.end_date.is_(None), Allocation.end_date >= date.today()),
        )
        .scalar()
        or 0
    )
    billable_alloc = (
        db.query(func.coalesce(func.sum(Allocation.allocation_percent), 0))
        .filter(
            Allocation.employee_id.in_(reports_ids),
            Allocation.is_billable == 1,
            or_(Allocation.end_date.is_(None), Allocation.end_date >= date.today()),
        )
        .scalar()
        or 0
    )
    util_pct = (billable_alloc / total_alloc * 100) if total_alloc > 0 else 0

    return {
        "team_attendance_count": len(team_att),
        "team_utilization": round(float(util_pct), 2),
        "pending_leave_approvals": pending_leaves,
    }


def _employee_dashboard(db: Session, employee_id: int, start_date: date, end_date: date) -> dict:
    present_days = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status.in_(["present", "wfh", "half_day"]),
        )
        .scalar()
        or 0
    )
    absent_days = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.employee_id == employee_id,
            Attendance.date >= start_date,
            Attendance.date <= end_date,
            Attendance.status == "absent",
        )
        .scalar()
        or 0
    )

    allocations = (
        db.query(Allocation)
        .join(Project)
        .filter(
            Allocation.employee_id == employee_id,
            or_(Allocation.end_date.is_(None), Allocation.end_date >= date.today()),
        )
        .all()
    )
    projects = [
        {"project_name": a.project.name, "allocation": a.allocation_percent, "billable": a.is_billable == 1}
        for a in allocations
    ]

    return {
        "attendance": {"present_days": present_days, "absent_days": absent_days},
        "assigned_projects": projects,
    }


@router.get("/leadership")
def leadership_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_leadership_or_above),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    end = end_date or date.today()
    start = start_date or (end - timedelta(days=30))
    return _leadership_dashboard(db, start, end)


@router.get("/manager")
def manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_above),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    if not current_user.employee:
        return {"team_attendance_count": 0, "team_utilization": 0, "pending_leave_approvals": 0}
    end = end_date or date.today()
    start = start_date or (end - timedelta(days=30))
    return _manager_dashboard(db, current_user.employee.id, start, end)


@router.get("/employee")
def employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    if not current_user.employee:
        return {"attendance": {"present_days": 0, "absent_days": 0}, "assigned_projects": []}
    end = end_date or date.today()
    start = start_date or (end - timedelta(days=30))
    return _employee_dashboard(db, current_user.employee.id, start, end)
