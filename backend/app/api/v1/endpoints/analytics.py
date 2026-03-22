"""Executive analytics suite - attrition, diversity, utilization, leave liability, trends."""
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.utils.date_display import format_display_date
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract, case

from app.api.deps import get_db, get_leadership_or_above
from app.models.user import User
from app.models.employee import Employee, Department, Designation
from app.models.attendance import Attendance
from app.models.leave import Leave, LeaveType, EmployeeLeaveBalance
from app.models.project import Allocation

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/executive")
def executive_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(get_leadership_or_above),
    months: int = Query(12, ge=1, le=36),
):
    today = date.today()
    start = today - timedelta(days=months * 30)

    active_count = db.query(func.count(Employee.id)).filter(Employee.status == "active").scalar() or 0
    total_count = db.query(func.count(Employee.id)).scalar() or 0
    inactive_count = total_count - active_count

    # --- Attrition ---
    exits_in_period = (
        db.query(func.count(Employee.id))
        .filter(Employee.exit_date >= start, Employee.exit_date.isnot(None))
        .scalar() or 0
    )
    avg_headcount = max((active_count + active_count + exits_in_period) / 2, 1)
    attrition_rate = round((exits_in_period / avg_headcount) * 100, 2)

    monthly_attrition = []
    for i in range(min(months, 12)):
        m_start = today.replace(day=1) - timedelta(days=30 * i)
        m_end = (m_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        exits = (
            db.query(func.count(Employee.id))
            .filter(Employee.exit_date >= m_start, Employee.exit_date <= m_end)
            .scalar() or 0
        )
        joins = (
            db.query(func.count(Employee.id))
            .filter(Employee.date_of_joining >= m_start, Employee.date_of_joining <= m_end, Employee.status == "active")
            .scalar() or 0
        )
        monthly_attrition.append({
            "month": format_display_date(date(m_start.year, m_start.month, 1)),
            "exits": exits,
            "joins": joins,
        })
    monthly_attrition.reverse()

    # --- Diversity (department distribution) ---
    dept_dist = (
        db.query(Department.name, func.count(Employee.id))
        .join(Employee, Employee.department_id == Department.id)
        .filter(Employee.status == "active")
        .group_by(Department.name)
        .all()
    )
    department_diversity = [{"name": r[0], "count": r[1], "percent": round(r[1] / max(active_count, 1) * 100, 1)} for r in dept_dist]

    designation_dist = (
        db.query(Designation.name, func.count(Employee.id))
        .join(Employee, Employee.designation_id == Designation.id)
        .filter(Employee.status == "active")
        .group_by(Designation.name)
        .all()
    )
    designation_diversity = [{"name": r[0], "count": r[1]} for r in designation_dist]

    # --- Tenure distribution ---
    tenure_buckets = {"< 1 yr": 0, "1-2 yrs": 0, "2-5 yrs": 0, "5+ yrs": 0}
    employees = db.query(Employee.date_of_joining).filter(Employee.status == "active").all()
    for (doj,) in employees:
        years = (today - doj).days / 365.25
        if years < 1:
            tenure_buckets["< 1 yr"] += 1
        elif years < 2:
            tenure_buckets["1-2 yrs"] += 1
        elif years < 5:
            tenure_buckets["2-5 yrs"] += 1
        else:
            tenure_buckets["5+ yrs"] += 1
    tenure_distribution = [{"bucket": k, "count": v} for k, v in tenure_buckets.items()]

    # --- Hiring velocity (last 6 months) ---
    hiring_velocity = []
    for i in range(6):
        m_start = today.replace(day=1) - timedelta(days=30 * i)
        m_end = (m_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        hires = (
            db.query(func.count(Employee.id))
            .filter(Employee.date_of_joining >= m_start, Employee.date_of_joining <= m_end)
            .scalar() or 0
        )
        hiring_velocity.append({"month": format_display_date(date(m_start.year, m_start.month, 1)), "hires": hires})
    hiring_velocity.reverse()

    # --- Utilization ---
    total_alloc = (
        db.query(func.coalesce(func.sum(Allocation.allocation_percent), 0))
        .join(Employee, Allocation.employee_id == Employee.id)
        .filter(Employee.status == "active")
        .filter(or_(Allocation.end_date.is_(None), Allocation.end_date >= today))
        .scalar() or 0
    )
    billable_alloc = (
        db.query(func.coalesce(func.sum(Allocation.allocation_percent), 0))
        .join(Employee, Allocation.employee_id == Employee.id)
        .filter(Employee.status == "active", Allocation.is_billable == 1)
        .filter(or_(Allocation.end_date.is_(None), Allocation.end_date >= today))
        .scalar() or 0
    )
    utilization_pct = round((billable_alloc / total_alloc * 100) if total_alloc > 0 else 0, 2)

    # --- Leave liability ---
    year = today.year
    leave_types = db.query(LeaveType).all()
    total_liability_days = 0
    leave_liability_by_type = []
    for lt in leave_types:
        max_days = lt.max_days_per_year if lt.max_days_per_year > 0 else 0
        total_entitled = max_days * active_count
        total_used = (
            db.query(func.coalesce(func.sum(Leave.days), 0))
            .filter(Leave.leave_type_id == lt.id, Leave.status == "approved", func.extract("year", Leave.start_date) == year)
            .scalar() or 0
        )
        remaining = total_entitled - float(total_used)
        total_liability_days += remaining
        leave_liability_by_type.append({
            "type": lt.name,
            "total_entitled": total_entitled,
            "total_used": float(total_used),
            "remaining_liability": remaining,
        })

    # --- Attendance trends (last 30 days) ---
    attendance_trends = []
    for i in range(30):
        d = today - timedelta(days=29 - i)
        present = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.date == d, Attendance.status.in_(["present", "wfh", "half_day"]))
            .scalar() or 0
        )
        absent = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.date == d, Attendance.status == "absent")
            .scalar() or 0
        )
        attendance_trends.append({"date": format_display_date(d), "present": present, "absent": absent})

    # --- Pending leaves ---
    pending_leaves = db.query(func.count(Leave.id)).filter(Leave.status == "pending").scalar() or 0

    return {
        "headcount": {"active": active_count, "inactive": inactive_count, "total": total_count},
        "attrition": {
            "rate_percent": attrition_rate,
            "exits_in_period": exits_in_period,
            "monthly": monthly_attrition,
        },
        "department_diversity": department_diversity,
        "designation_diversity": designation_diversity,
        "tenure_distribution": tenure_distribution,
        "hiring_velocity": hiring_velocity,
        "utilization": {
            "total_allocation": float(total_alloc),
            "billable_allocation": float(billable_alloc),
            "utilization_percent": utilization_pct,
        },
        "leave_liability": {
            "total_liability_days": total_liability_days,
            "by_type": leave_liability_by_type,
        },
        "attendance_trends": attendance_trends,
        "pending_leaves": pending_leaves,
    }
