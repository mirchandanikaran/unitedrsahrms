"""Leave schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class LeaveTypeBase(BaseModel):
    name: str
    code: str | None = None
    max_days_per_year: float = 0
    is_paid: int = 1
    probation_months: int = 0


class LeaveTypeCreate(LeaveTypeBase):
    pass


class LeaveTypeResponse(LeaveTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HolidayBase(BaseModel):
    name: str
    date: date
    year: int
    is_optional: int = 0
    region: str | None = None


class HolidayCreate(HolidayBase):
    pass


class HolidayUpdate(BaseModel):
    name: str | None = None
    date: Optional[date] = None
    year: int | None = None
    is_optional: int | None = None
    region: str | None = None


class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveBase(BaseModel):
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    days: float
    reason: str | None = None


class LeaveCreate(LeaveBase):
    pass


class LeaveUpdate(BaseModel):
    status: str | None = None
    rejection_reason: str | None = None


class LeaveResponse(LeaveBase):
    id: int
    status: str
    approved_by_id: int | None = None
    approved_by_name: str | None = None
    approved_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    employee_name: Optional[str] = None
    leave_type_name: Optional[str] = None

    class Config:
        from_attributes = True


class LeaveBalanceResponse(BaseModel):
    leave_type_id: int
    leave_type_name: str
    total_days: float
    used_days: float
    pending_days: float = 0
    balance: float


class LeaveBalanceUpdateRequest(BaseModel):
    employee_id: int
    leave_type_id: int
    total_days: float
    year: int | None = None


class CalendarHolidayItem(BaseModel):
    id: int
    name: str
    is_optional: int
    region: str | None = None


class CalendarLeaveItem(BaseModel):
    leave_id: int
    employee_id: int
    employee_name: str
    leave_type_name: str
    is_self: bool = False


class CalendarDay(BaseModel):
    date: date
    mandatory_holidays: list[CalendarHolidayItem]
    optional_holidays: list[CalendarHolidayItem]
    approved_leaves: list[CalendarLeaveItem]


class LeaveCalendarMonthResponse(BaseModel):
    year: int
    month: int
    days: list[CalendarDay]
