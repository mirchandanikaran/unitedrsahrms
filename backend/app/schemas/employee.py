"""Employee, Department, Designation schemas."""
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr


# Department
class DepartmentBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Designation
class DesignationBase(BaseModel):
    name: str
    level: int = 0


class DesignationCreate(DesignationBase):
    pass


class DesignationResponse(DesignationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Employee
class EmployeeBase(BaseModel):
    employee_code: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None
    date_of_birth: date | None = None
    date_of_joining: date
    department_id: int
    designation_id: int
    manager_id: int | None = None
    status: str = "active"
    address: str | None = None
    emergency_contact: str | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    department_id: int | None = None
    designation_id: int | None = None
    manager_id: int | None = None
    status: str | None = None
    address: str | None = None
    emergency_contact: str | None = None
    exit_date: date | None = None


class EmployeeResponse(EmployeeBase):
    id: int
    exit_date: date | None = None
    created_at: datetime
    department: DepartmentResponse | None = None
    designation: DesignationResponse | None = None
    manager: Optional["EmployeeResponse"] = None

    class Config:
        from_attributes = True


EmployeeResponse.model_rebuild()


# Reporting structure (manager chain / org tree)
class ReportingNode(BaseModel):
    id: int
    employee_code: str
    first_name: str
    last_name: str
    email: str
    department: str | None = None
    designation: str | None = None
    manager_id: int | None = None
    status: str


class ReportingStructureResponse(BaseModel):
    """Org-wide (admin, leadership) or personal subtree for everyone else with an employee profile."""

    scope: Literal["self", "organization"]
    nodes: list[ReportingNode]
    focus_employee_id: int | None = None
    # Populated when scope == "self" (top of chain first, down to immediate manager)
    reports_to_chain: list[ReportingNode] | None = None
    direct_reports: list[ReportingNode] | None = None
