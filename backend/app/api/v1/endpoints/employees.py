"""Employee, Department, Designation endpoints."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.models.user import User
from app.api.deps import get_db, get_admin_or_hr, get_current_user
from app.models.employee import Employee, Department, Designation
from app.schemas.employee import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DesignationCreate,
    DesignationResponse,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/employees", tags=["employees"])


def _employee_to_response(e: Employee, include_manager: bool = True) -> EmployeeResponse:
    manager_resp = None
    if e.manager and include_manager:
        manager_resp = EmployeeResponse(
            id=e.manager.id,
            employee_code=e.manager.employee_code,
            first_name=e.manager.first_name,
            last_name=e.manager.last_name,
            email=e.manager.email,
            phone=e.manager.phone,
            date_of_birth=e.manager.date_of_birth,
            date_of_joining=e.manager.date_of_joining,
            department_id=e.manager.department_id,
            designation_id=e.manager.designation_id,
            manager_id=e.manager.manager_id,
            status=e.manager.status,
            address=e.manager.address,
            emergency_contact=e.manager.emergency_contact,
            exit_date=e.manager.exit_date,
            created_at=e.manager.created_at,
            department=DepartmentResponse.model_validate(e.manager.department) if e.manager.department else None,
            designation=DesignationResponse.model_validate(e.manager.designation) if e.manager.designation else None,
            manager=None,  # Avoid recursion
        )
    return EmployeeResponse(
        id=e.id,
        employee_code=e.employee_code,
        first_name=e.first_name,
        last_name=e.last_name,
        email=e.email,
        phone=e.phone,
        date_of_birth=e.date_of_birth,
        date_of_joining=e.date_of_joining,
        department_id=e.department_id,
        designation_id=e.designation_id,
        manager_id=e.manager_id,
        status=e.status,
        address=e.address,
        emergency_contact=e.emergency_contact,
        exit_date=e.exit_date,
        created_at=e.created_at,
        department=DepartmentResponse.model_validate(e.department) if e.department else None,
        designation=DesignationResponse.model_validate(e.designation) if e.designation else None,
        manager=manager_resp,
    )


# Departments
@router.get("/departments", response_model=list[DepartmentResponse])
def list_departments(db: Session = Depends(get_db), _: User = Depends(get_admin_or_hr)):
    return db.query(Department).all()


@router.post("/departments", response_model=DepartmentResponse)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(dept, k, v)
    db.commit()
    db.refresh(dept)
    return dept


# Designations
@router.get("/designations", response_model=list[DesignationResponse])
def list_designations(db: Session = Depends(get_db), _: User = Depends(get_admin_or_hr)):
    return db.query(Designation).all()


@router.post("/designations", response_model=DesignationResponse)
def create_designation(
    data: DesignationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    desig = Designation(**data.model_dump())
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return desig


# Employees
@router.get("", response_model=PaginatedResponse[EmployeeResponse])
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    department_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.designation),
        joinedload(Employee.manager),
    )
    if department_id:
        q = q.filter(Employee.department_id == department_id)
    if status_filter:
        q = q.filter(Employee.status == status_filter)
    if search:
        q = q.filter(
            (Employee.first_name.ilike(f"%{search}%"))
            | (Employee.last_name.ilike(f"%{search}%"))
            | (Employee.email.ilike(f"%{search}%"))
            | (Employee.employee_code.ilike(f"%{search}%"))
        )
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        items=[_employee_to_response(e) for e in items],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get("/me", response_model=EmployeeResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.employee:
        raise HTTPException(404, "No employee profile linked")
    e = (
        db.query(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.manager),
        )
        .filter(Employee.id == current_user.employee.id)
        .first()
    )
    return _employee_to_response(e)


@router.get("/{emp_id}", response_model=EmployeeResponse)
def get_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    e = (
        db.query(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
            joinedload(Employee.manager),
        )
        .filter(Employee.id == emp_id)
        .first()
    )
    if not e:
        raise HTTPException(404, "Employee not found")
    return _employee_to_response(e)


@router.post("", response_model=EmployeeResponse)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    if db.query(Employee).filter(Employee.employee_code == data.employee_code).first():
        raise HTTPException(400, "Employee code already exists")
    if db.query(Employee).filter(Employee.email == data.email).first():
        raise HTTPException(400, "Email already exists")
    emp = Employee(**data.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return _employee_to_response(emp)


@router.put("/{emp_id}", response_model=EmployeeResponse)
def update_employee(
    emp_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return _employee_to_response(emp)
