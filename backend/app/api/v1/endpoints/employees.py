"""Employee, Department, Designation endpoints."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, RoleEnum
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
    ReportingNode,
    ReportingStructureResponse,
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


def _to_reporting_node(e: Employee) -> ReportingNode:
    return ReportingNode(
        id=e.id,
        employee_code=e.employee_code,
        first_name=e.first_name,
        last_name=e.last_name,
        email=e.email,
        department=e.department.name if e.department else None,
        designation=e.designation.name if e.designation else None,
        manager_id=e.manager_id,
        status=e.status,
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


@router.get("/reporting-structure", response_model=ReportingStructureResponse)
def get_reporting_structure(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin & leadership: full org reporting tree. Other roles: own manager chain + direct reports."""
    if current_user.role in (RoleEnum.ADMIN, RoleEnum.LEADERSHIP):
        emps = (
            db.query(Employee)
            .options(
                joinedload(Employee.department),
                joinedload(Employee.designation),
            )
            .order_by(Employee.employee_code)
            .all()
        )
        return ReportingStructureResponse(
            scope="organization",
            nodes=[_to_reporting_node(e) for e in emps],
            focus_employee_id=None,
            reports_to_chain=None,
            direct_reports=None,
        )

    if not current_user.employee:
        raise HTTPException(
            status_code=403,
            detail="Reporting structure requires a linked employee profile for your role",
        )

    self_emp = (
        db.query(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
        )
        .filter(Employee.id == current_user.employee.id)
        .first()
    )
    if not self_emp:
        raise HTTPException(404, "Employee not found")

    # Walk up manager chain (immediate manager first, then up); cap depth and detect cycles
    managers_immediate_first: list[ReportingNode] = []
    cur = self_emp
    seen_ids: set[int] = {self_emp.id}
    for _ in range(64):
        if not cur.manager_id:
            break
        if cur.manager_id in seen_ids:
            break
        seen_ids.add(cur.manager_id)
        mgr = (
            db.query(Employee)
            .options(
                joinedload(Employee.department),
                joinedload(Employee.designation),
            )
            .filter(Employee.id == cur.manager_id)
            .first()
        )
        if not mgr:
            break
        managers_immediate_first.append(_to_reporting_node(mgr))
        cur = mgr

    reports_to_chain = list(reversed(managers_immediate_first))

    subordinates = (
        db.query(Employee)
        .options(
            joinedload(Employee.department),
            joinedload(Employee.designation),
        )
        .filter(Employee.manager_id == self_emp.id)
        .order_by(Employee.employee_code)
        .all()
    )
    direct_nodes = [_to_reporting_node(s) for s in subordinates]

    self_node = _to_reporting_node(self_emp)
    by_id: dict[int, ReportingNode] = {}
    for n in reports_to_chain + [self_node] + direct_nodes:
        by_id[n.id] = n

    return ReportingStructureResponse(
        scope="self",
        nodes=list(by_id.values()),
        focus_employee_id=self_emp.id,
        reports_to_chain=reports_to_chain,
        direct_reports=direct_nodes,
    )


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


@router.delete("/{emp_id}")
def remove_employee(
    emp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    # Soft remove to preserve historical records and avoid FK issues.
    emp.status = "inactive"
    emp.exit_date = date.today()
    if emp.user:
        emp.user.is_active = False
    db.commit()
    return {"message": "Employee removed (set inactive)", "employee_id": emp_id}
