"""Reports - export CSV/Excel with filters."""
from datetime import date
from typing import Optional
import io
import csv

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_admin_or_hr
from app.utils.date_display import format_display_date
from app.models.user import User
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.leave import Leave
from app.models.project import Project, Allocation

router = APIRouter(prefix="/reports", tags=["reports"])


def _employee_master_csv(db: Session, dept_id: Optional[int], status: Optional[str]) -> io.StringIO:
    q = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.designation),
        joinedload(Employee.manager),
    )
    if dept_id:
        q = q.filter(Employee.department_id == dept_id)
    if status:
        q = q.filter(Employee.status == status)
    rows = q.order_by(Employee.employee_code).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee Code", "First Name", "Last Name", "Email", "Phone",
        "Department", "Designation", "Manager", "Status", "Date of Joining", "Exit Date"
    ])
    for e in rows:
        writer.writerow([
            e.employee_code,
            e.first_name,
            e.last_name,
            e.email,
            e.phone or "",
            e.department.name if e.department else "",
            e.designation.name if e.designation else "",
            f"{e.manager.first_name} {e.manager.last_name}" if e.manager else "",
            e.status,
            format_display_date(e.date_of_joining),
            format_display_date(e.exit_date) if e.exit_date else "",
        ])
    output.seek(0)
    return output


def _attendance_csv(
    db: Session,
    start_date: date,
    end_date: date,
    employee_id: Optional[int],
    dept_id: Optional[int],
) -> io.StringIO:
    q = db.query(Attendance).join(Employee).options(joinedload(Attendance.employee))
    q = q.filter(Attendance.date >= start_date, Attendance.date <= end_date)
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if dept_id:
        q = q.filter(Employee.department_id == dept_id)
    rows = q.order_by(Attendance.date, Employee.employee_code).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Employee Code", "Employee Name", "Status", "Check In", "Check Out"])
    for a in rows:
        writer.writerow([
            format_display_date(a.date),
            a.employee.employee_code if a.employee else "",
            f"{a.employee.first_name} {a.employee.last_name}" if a.employee else "",
            a.status,
            str(a.check_in) if a.check_in else "",
            str(a.check_out) if a.check_out else "",
        ])
    output.seek(0)
    return output


def _leave_csv(
    db: Session,
    start_date: date,
    end_date: date,
    employee_id: Optional[int],
    status: Optional[str],
) -> io.StringIO:
    q = db.query(Leave).options(
        joinedload(Leave.employee),
        joinedload(Leave.leave_type),
    )
    q = q.filter(Leave.start_date >= start_date, Leave.end_date <= end_date)
    if employee_id:
        q = q.filter(Leave.employee_id == employee_id)
    if status:
        q = q.filter(Leave.status == status)
    rows = q.order_by(Leave.start_date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee Code", "Employee Name", "Leave Type", "Start Date", "End Date",
        "Days", "Status", "Reason"
    ])
    for l in rows:
        writer.writerow([
            l.employee.employee_code if l.employee else "",
            f"{l.employee.first_name} {l.employee.last_name}" if l.employee else "",
            l.leave_type.name if l.leave_type else "",
            format_display_date(l.start_date),
            format_display_date(l.end_date),
            l.days,
            l.status,
            l.reason or "",
        ])
    output.seek(0)
    return output


def _utilization_csv(
    db: Session,
    employee_id: Optional[int],
    project_id: Optional[int],
) -> io.StringIO:
    q = db.query(Allocation).options(
        joinedload(Allocation.employee),
        joinedload(Allocation.project),
    )
    if employee_id:
        q = q.filter(Allocation.employee_id == employee_id)
    if project_id:
        q = q.filter(Allocation.project_id == project_id)
    rows = q.filter(
        (Allocation.end_date.is_(None)) | (Allocation.end_date >= date.today())
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Employee Code", "Employee Name", "Project", "Allocation %",
        "Billable", "Start Date", "End Date", "Role"
    ])
    for a in rows:
        writer.writerow([
            a.employee.employee_code if a.employee else "",
            f"{a.employee.first_name} {a.employee.last_name}" if a.employee else "",
            a.project.name if a.project else "",
            a.allocation_percent,
            "Yes" if a.is_billable else "No",
            format_display_date(a.start_date),
            format_display_date(a.end_date) if a.end_date else "",
            a.role_in_project or "",
        ])
    output.seek(0)
    return output


def _project_allocation_csv(
    db: Session,
    project_id: Optional[int],
) -> io.StringIO:
    q = db.query(Allocation).options(
        joinedload(Allocation.employee),
        joinedload(Allocation.project),
    )
    if project_id:
        q = q.filter(Allocation.project_id == project_id)
    rows = q.filter(
        (Allocation.end_date.is_(None)) | (Allocation.end_date >= date.today())
    ).order_by(Allocation.project_id, Allocation.employee_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Project", "Employee Code", "Employee Name", "Allocation %",
        "Billable", "Role"
    ])
    for a in rows:
        writer.writerow([
            a.project.name if a.project else "",
            a.employee.employee_code if a.employee else "",
            f"{a.employee.first_name} {a.employee.last_name}" if a.employee else "",
            a.allocation_percent,
            "Yes" if a.is_billable else "No",
            a.role_in_project or "",
        ])
    output.seek(0)
    return output


@router.get("/employee-master/export")
def export_employee_master(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    department_id: Optional[int] = None,
    status: Optional[str] = None,
):
    output = _employee_master_csv(db, department_id, status)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employee_master.csv"},
    )


@router.get("/attendance/export")
def export_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    start_date: date = Query(...),
    end_date: date = Query(...),
    employee_id: Optional[int] = None,
    department_id: Optional[int] = None,
):
    output = _attendance_csv(db, start_date, end_date, employee_id, department_id)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_{format_display_date(start_date)}_{format_display_date(end_date)}.csv"
        },
    )


@router.get("/leave/export")
def export_leave(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    start_date: date = Query(...),
    end_date: date = Query(...),
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
):
    output = _leave_csv(db, start_date, end_date, employee_id, status)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=leave_{format_display_date(start_date)}_{format_display_date(end_date)}.csv"
        },
    )


@router.get("/utilization/export")
def export_utilization(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    employee_id: Optional[int] = None,
    project_id: Optional[int] = None,
):
    output = _utilization_csv(db, employee_id, project_id)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=utilization.csv"},
    )


@router.get("/project-allocation/export")
def export_project_allocation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    project_id: Optional[int] = None,
):
    output = _project_allocation_csv(db, project_id)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=project_allocation.csv"},
    )
