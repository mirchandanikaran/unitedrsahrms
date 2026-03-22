"""Attendance schemas."""
from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel


class AttendanceBase(BaseModel):
    employee_id: int
    date: date
    status: str = "present"  # present, absent, wfh, half_day
    check_in: time | None = None
    check_out: time | None = None
    remarks: str | None = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: str | None = None
    check_in: time | None = None
    check_out: time | None = None
    remarks: str | None = None


class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    employee_name: Optional[str] = None

    class Config:
        from_attributes = True


class AttendanceBulkCreate(BaseModel):
    date: date
    records: list[dict]  # [{"employee_id": 1, "status": "present"}, ...]
