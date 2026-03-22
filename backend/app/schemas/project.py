"""Project and Allocation schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ProjectBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None
    client_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str = "active"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    client_name: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AllocationBase(BaseModel):
    employee_id: int
    project_id: int
    allocation_percent: float = 0
    is_billable: int = 1
    start_date: date
    end_date: date | None = None
    role_in_project: str | None = None


class AllocationCreate(AllocationBase):
    pass


class AllocationUpdate(BaseModel):
    allocation_percent: float | None = None
    is_billable: int | None = None
    end_date: date | None = None
    role_in_project: str | None = None


class AllocationResponse(AllocationBase):
    id: int
    created_at: datetime
    employee_name: Optional[str] = None
    project_name: Optional[str] = None

    class Config:
        from_attributes = True
