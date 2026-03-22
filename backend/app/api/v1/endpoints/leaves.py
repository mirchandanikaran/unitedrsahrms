"""Leave and Holiday endpoints."""
import calendar
from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.api.deps import get_db, get_admin_or_hr, get_admin_only, get_manager_or_above, get_current_user
from app.models.user import User
from app.models.leave import Leave, LeaveType, Holiday, EmployeeLeaveBalance
from app.models.employee import Employee
from app.schemas.leave import (
    LeaveCreate,
    LeaveUpdate,
    LeaveResponse,
    LeaveTypeCreate,
    LeaveTypeResponse,
    HolidayCreate,
    HolidayUpdate,
    HolidayResponse,
    LeaveBalanceResponse,
    LeaveBalanceUpdateRequest,
    CalendarDay,
    CalendarHolidayItem,
    CalendarLeaveItem,
    LeaveCalendarMonthResponse,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/leaves", tags=["leaves"])


@router.get("/types", response_model=list[LeaveTypeResponse])
def list_leave_types(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(LeaveType).all()


@router.post("/types", response_model=LeaveTypeResponse)
def create_leave_type(
    data: LeaveTypeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    lt = LeaveType(**data.model_dump())
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt


@router.get("/holidays", response_model=list[HolidayResponse])
def list_holidays(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    year: Optional[int] = None,
    region: Optional[str] = None,
):
    q = db.query(Holiday)
    if year:
        q = q.filter(Holiday.year == year)
    if region:
        q = q.filter((Holiday.region == region) | (Holiday.region.is_(None)))
    return q.order_by(Holiday.date).all()


@router.post("/holidays", response_model=HolidayResponse)
def create_holiday(
    data: HolidayCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_only),
):
    h = Holiday(**data.model_dump())
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.put("/holidays/{holiday_id}", response_model=HolidayResponse)
def update_holiday(
    holiday_id: int,
    data: HolidayUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_only),
):
    h = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not h:
        raise HTTPException(404, "Holiday not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(h, k, v)
    if h.date and h.year != h.date.year:
        h.year = h.date.year
    db.commit()
    db.refresh(h)
    return h


@router.delete("/holidays/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_only),
):
    h = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not h:
        raise HTTPException(404, "Holiday not found")
    db.delete(h)
    db.commit()
    return {"message": "Holiday removed", "id": holiday_id}


@router.get("/calendar", response_model=LeaveCalendarMonthResponse)
def leave_calendar_month(
    year: int = Query(..., description="Calendar year"),
    month: int = Query(..., ge=1, le=12),
    region: Optional[str] = Query(
        "IN",
        description="Holiday region: 'IN' shows India + global (null). Empty string = all regions.",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Month view: mandatory/optional holidays and all approved leaves (updates when managers approve)."""
    first = date(year, month, 1)
    last = date(year, month, calendar.monthrange(year, month)[1])

    hq = db.query(Holiday).filter(Holiday.date >= first, Holiday.date <= last)
    if region is not None and region != "":
        hq = hq.filter((Holiday.region == region) | (Holiday.region.is_(None)))
    month_holidays = hq.order_by(Holiday.date).all()
    by_date_h: dict[date, list[Holiday]] = {}
    for h in month_holidays:
        by_date_h.setdefault(h.date, []).append(h)

    lq = (
        db.query(Leave)
        .options(joinedload(Leave.employee), joinedload(Leave.leave_type))
        .filter(
            Leave.status == "approved",
            Leave.start_date <= last,
            Leave.end_date >= first,
        )
    )
    approved = lq.all()
    by_date_l: dict[date, list[Leave]] = {}
    for lv in approved:
        d = max(lv.start_date, first)
        end_lv = min(lv.end_date, last)
        while d <= end_lv:
            by_date_l.setdefault(d, []).append(lv)
            d = d + timedelta(days=1)

    self_emp_id = current_user.employee.id if current_user.employee else None

    days_out: list[CalendarDay] = []
    for dom in range(1, calendar.monthrange(year, month)[1] + 1):
        d = date(year, month, dom)
        hols = by_date_h.get(d, [])
        mand = [
            CalendarHolidayItem(id=h.id, name=h.name, is_optional=h.is_optional, region=h.region)
            for h in hols
            if h.is_optional == 0
        ]
        opt = [
            CalendarHolidayItem(id=h.id, name=h.name, is_optional=h.is_optional, region=h.region)
            for h in hols
            if h.is_optional != 0
        ]
        leaves_day = by_date_l.get(d, [])
        seen_leave_ids: set[int] = set()
        leave_items: list[CalendarLeaveItem] = []
        for lv in leaves_day:
            if lv.id in seen_leave_ids:
                continue
            seen_leave_ids.add(lv.id)
            ename = f"{lv.employee.first_name} {lv.employee.last_name}" if lv.employee else "Unknown"
            ltname = lv.leave_type.name if lv.leave_type else "Leave"
            leave_items.append(
                CalendarLeaveItem(
                    leave_id=lv.id,
                    employee_id=lv.employee_id,
                    employee_name=ename,
                    leave_type_name=ltname,
                    is_self=bool(self_emp_id and lv.employee_id == self_emp_id),
                )
            )
        days_out.append(
            CalendarDay(
                date=d,
                mandatory_holidays=mand,
                optional_holidays=opt,
                approved_leaves=leave_items,
            )
        )

    return LeaveCalendarMonthResponse(year=year, month=month, days=days_out)


@router.get("/balance", response_model=list[LeaveBalanceResponse])
def get_leave_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    employee_id: Optional[int] = None,
    year: Optional[int] = None,
):
    emp_id = employee_id or (current_user.employee.id if current_user.employee else None)
    if not emp_id:
        # Admin/HR may query specific employees from UI; empty response by default.
        if current_user.role.value in ["admin", "hr"]:
            return []
        raise HTTPException(400, "employee_id required")
    yr = year or date.today().year
    types = db.query(LeaveType).all()
    result = []
    for lt in types:
        override = (
            db.query(EmployeeLeaveBalance)
            .filter(
                EmployeeLeaveBalance.employee_id == emp_id,
                EmployeeLeaveBalance.leave_type_id == lt.id,
                EmployeeLeaveBalance.year == yr,
            )
            .first()
        )
        total = override.total_days if override else (lt.max_days_per_year if lt.max_days_per_year > 0 else 999)
        used = (
            db.query(func.coalesce(func.sum(Leave.days), 0))
            .filter(
                Leave.employee_id == emp_id,
                Leave.leave_type_id == lt.id,
                Leave.status == "approved",
                func.extract("year", Leave.start_date) == yr,
            )
            .scalar()
            or 0
        )
        pending = (
            db.query(func.coalesce(func.sum(Leave.days), 0))
            .filter(
                Leave.employee_id == emp_id,
                Leave.leave_type_id == lt.id,
                Leave.status == "pending",
                func.extract("year", Leave.start_date) == yr,
            )
            .scalar()
            or 0
        )
        result.append(
            LeaveBalanceResponse(
                leave_type_id=lt.id,
                leave_type_name=lt.name,
                total_days=total,
                used_days=float(used),
                pending_days=float(pending),
                balance=total - float(used) if total != 999 else 999 - float(used),
            )
        )
    return result


@router.put("/balance")
def update_leave_balance(
    data: LeaveBalanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    yr = data.year or date.today().year
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    lt = db.query(LeaveType).filter(LeaveType.id == data.leave_type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")

    row = (
        db.query(EmployeeLeaveBalance)
        .filter(
            EmployeeLeaveBalance.employee_id == data.employee_id,
            EmployeeLeaveBalance.leave_type_id == data.leave_type_id,
            EmployeeLeaveBalance.year == yr,
        )
        .first()
    )
    if not row:
        row = EmployeeLeaveBalance(
            employee_id=data.employee_id,
            leave_type_id=data.leave_type_id,
            year=yr,
            total_days=data.total_days,
        )
        db.add(row)
    else:
        row.total_days = data.total_days
    db.commit()
    db.refresh(row)
    return {"message": "Leave balance updated", "employee_id": row.employee_id, "leave_type_id": row.leave_type_id, "year": row.year, "total_days": row.total_days}


@router.get("", response_model=PaginatedResponse[LeaveResponse])
def list_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = None,
):
    q = db.query(Leave).options(
        joinedload(Leave.employee),
        joinedload(Leave.leave_type),
        joinedload(Leave.approved_by),
    )
    if current_user.role.value == "employee" and current_user.employee:
        q = q.filter(Leave.employee_id == current_user.employee.id)
    elif current_user.role.value == "manager" and current_user.employee:
        team_ids = [r[0] for r in db.query(Employee.id).filter(Employee.manager_id == current_user.employee.id).all()]
        team_ids.append(current_user.employee.id)
        q = q.filter(Leave.employee_id.in_(team_ids))
    elif employee_id:
        q = q.filter(Leave.employee_id == employee_id)
    if status_filter:
        q = q.filter(Leave.status == status_filter)
    q = q.order_by(Leave.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        items=[
            LeaveResponse(
                id=l.id,
                employee_id=l.employee_id,
                leave_type_id=l.leave_type_id,
                start_date=l.start_date,
                end_date=l.end_date,
                days=l.days,
                reason=l.reason,
                status=l.status,
                approved_by_id=l.approved_by_id,
                approved_by_name=f"{l.approved_by.first_name} {l.approved_by.last_name}" if l.approved_by else None,
                approved_at=l.approved_at,
                rejection_reason=l.rejection_reason,
                created_at=l.created_at,
                employee_name=f"{l.employee.first_name} {l.employee.last_name}" if l.employee else None,
                leave_type_name=l.leave_type.name if l.leave_type else None,
            )
            for l in items
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post("", response_model=LeaveResponse)
def create_leave(
    data: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    emp_id = data.employee_id
    if current_user.role.value == "employee" and current_user.employee:
        emp_id = current_user.employee.id
    leave = Leave(
        employee_id=emp_id,
        leave_type_id=data.leave_type_id,
        start_date=data.start_date,
        end_date=data.end_date,
        days=data.days,
        reason=data.reason,
        status="pending",
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    leave.employee = db.query(Employee).get(leave.employee_id)
    leave.leave_type = db.query(LeaveType).get(leave.leave_type_id)
    return LeaveResponse(
        id=leave.id,
        employee_id=leave.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days=leave.days,
        reason=leave.reason,
        status=leave.status,
        approved_by_id=leave.approved_by_id,
        approved_by_name=None,
        approved_at=leave.approved_at,
        rejection_reason=leave.rejection_reason,
        created_at=leave.created_at,
        employee_name=f"{leave.employee.first_name} {leave.employee.last_name}" if leave.employee else None,
        leave_type_name=leave.leave_type.name if leave.leave_type else None,
    )


@router.put("/{leave_id}/approve", response_model=LeaveResponse)
def approve_leave(
    leave_id: int,
    data: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_above),
):
    from datetime import datetime as dt

    leave = db.query(Leave).options(
        joinedload(Leave.employee),
        joinedload(Leave.leave_type),
    ).filter(Leave.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    leave.status = data.status or "approved"
    leave.approved_by_id = current_user.employee.id if current_user.employee else None
    leave.approved_at = dt.utcnow()
    if data.rejection_reason:
        leave.rejection_reason = data.rejection_reason
    db.commit()
    db.refresh(leave)
    approver_name = None
    if leave.approved_by_id:
        approver = db.query(Employee).filter(Employee.id == leave.approved_by_id).first()
        approver_name = f"{approver.first_name} {approver.last_name}" if approver else None
    return LeaveResponse(
        id=leave.id,
        employee_id=leave.employee_id,
        leave_type_id=leave.leave_type_id,
        start_date=leave.start_date,
        end_date=leave.end_date,
        days=leave.days,
        reason=leave.reason,
        status=leave.status,
        approved_by_id=leave.approved_by_id,
        approved_by_name=approver_name,
        approved_at=leave.approved_at,
        rejection_reason=leave.rejection_reason,
        created_at=leave.created_at,
        employee_name=f"{leave.employee.first_name} {leave.employee.last_name}" if leave.employee else None,
        leave_type_name=leave.leave_type.name if leave.leave_type else None,
    )
