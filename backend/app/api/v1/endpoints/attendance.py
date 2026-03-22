"""Attendance endpoints."""
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_admin_or_hr, get_manager_or_above
from app.models.user import User
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceResponse, AttendanceBulkCreate
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("", response_model=PaginatedResponse[AttendanceResponse])
def list_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    employee_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status_filter: Optional[str] = None,
):
    q = db.query(Attendance).options(joinedload(Attendance.employee))
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if start_date:
        q = q.filter(Attendance.date >= start_date)
    if end_date:
        q = q.filter(Attendance.date <= end_date)
    if status_filter:
        q = q.filter(Attendance.status == status_filter)
    q = q.order_by(Attendance.date.desc(), Attendance.employee_id)
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        items=[
            AttendanceResponse(
                id=a.id,
                employee_id=a.employee_id,
                date=a.date,
                status=a.status,
                check_in=a.check_in,
                check_out=a.check_out,
                remarks=a.remarks,
                created_at=a.created_at,
                employee_name=f"{a.employee.first_name} {a.employee.last_name}" if a.employee else None,
            )
            for a in items
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post("/bulk")
def bulk_create_attendance(
    data: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    created = 0
    for rec in data.records:
        emp_id = rec.get("employee_id")
        status_val = rec.get("status", "present")
        if not emp_id:
            continue
        existing = db.query(Attendance).filter(
            Attendance.employee_id == emp_id,
            Attendance.date == data.date,
        ).first()
        if existing:
            existing.status = status_val
            db.merge(existing)
        else:
            att = Attendance(employee_id=emp_id, date=data.date, status=status_val)
            db.add(att)
            created += 1
    db.commit()
    return {"message": "Bulk attendance updated", "created": created}


@router.post("", response_model=AttendanceResponse)
def create_attendance(
    data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    existing = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.date == data.date,
    ).first()
    if existing:
        raise HTTPException(400, "Attendance already exists for this employee on this date")
    att = Attendance(**data.model_dump())
    db.add(att)
    db.commit()
    db.refresh(att)
    att.employee = db.query(Employee).get(att.employee_id)
    return AttendanceResponse(
        **att.__dict__,
        employee_name=f"{att.employee.first_name} {att.employee.last_name}" if att.employee else None,
    )


@router.put("/{att_id}", response_model=AttendanceResponse)
def update_attendance(
    att_id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    att = db.query(Attendance).options(joinedload(Attendance.employee)).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(404, "Attendance record not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(att, k, v)
    db.commit()
    db.refresh(att)
    return AttendanceResponse(
        id=att.id,
        employee_id=att.employee_id,
        date=att.date,
        status=att.status,
        check_in=att.check_in,
        check_out=att.check_out,
        remarks=att.remarks,
        created_at=att.created_at,
        employee_name=f"{att.employee.first_name} {att.employee.last_name}" if att.employee else None,
    )
