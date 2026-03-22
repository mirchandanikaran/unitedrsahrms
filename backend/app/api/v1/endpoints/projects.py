"""Project and Allocation endpoints."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_admin_or_hr
from app.models.user import User
from app.models.project import Project, Allocation
from app.models.employee import Employee
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    AllocationCreate,
    AllocationUpdate,
    AllocationResponse,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=PaginatedResponse[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
):
    q = db.query(Project)
    if status_filter:
        q = q.filter(Project.status == status_filter)
    if search:
        q = q.filter(
            (Project.name.ilike(f"%{search}%")) | (Project.code.ilike(f"%{search}%"))
        )
    q = q.order_by(Project.created_at.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        items=[ProjectResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post("", response_model=ProjectResponse)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    proj = Project(**data.model_dump())
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@router.put("/{proj_id}", response_model=ProjectResponse)
def update_project(
    proj_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    proj = db.query(Project).filter(Project.id == proj_id).first()
    if not proj:
        raise HTTPException(404, "Project not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(proj, k, v)
    db.commit()
    db.refresh(proj)
    return proj


@router.get("/{proj_id}", response_model=ProjectResponse)
def get_project(
    proj_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    proj = db.query(Project).filter(Project.id == proj_id).first()
    if not proj:
        raise HTTPException(404, "Project not found")
    return proj


# Allocations
@router.get("/allocations/list", response_model=PaginatedResponse[AllocationResponse])
def list_allocations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    employee_id: Optional[int] = None,
    project_id: Optional[int] = None,
):
    q = db.query(Allocation).options(
        joinedload(Allocation.employee),
        joinedload(Allocation.project),
    )
    if employee_id:
        q = q.filter(Allocation.employee_id == employee_id)
    if project_id:
        q = q.filter(Allocation.project_id == project_id)
    q = q.order_by(Allocation.start_date.desc())
    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        items=[
            AllocationResponse(
                id=a.id,
                employee_id=a.employee_id,
                project_id=a.project_id,
                allocation_percent=a.allocation_percent,
                is_billable=a.is_billable,
                start_date=a.start_date,
                end_date=a.end_date,
                role_in_project=a.role_in_project,
                created_at=a.created_at,
                employee_name=f"{a.employee.first_name} {a.employee.last_name}" if a.employee else None,
                project_name=a.project.name if a.project else None,
            )
            for a in items
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post("/allocations", response_model=AllocationResponse)
def create_allocation(
    data: AllocationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    alloc = Allocation(**data.model_dump())
    db.add(alloc)
    db.commit()
    db.refresh(alloc)
    alloc.employee = db.query(Employee).get(alloc.employee_id)
    alloc.project = db.query(Project).get(alloc.project_id)
    return AllocationResponse(
        **alloc.__dict__,
        employee_name=f"{alloc.employee.first_name} {alloc.employee.last_name}" if alloc.employee else None,
        project_name=alloc.project.name if alloc.project else None,
    )


@router.put("/allocations/{alloc_id}", response_model=AllocationResponse)
def update_allocation(
    alloc_id: int,
    data: AllocationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    alloc = db.query(Allocation).options(
        joinedload(Allocation.employee),
        joinedload(Allocation.project),
    ).filter(Allocation.id == alloc_id).first()
    if not alloc:
        raise HTTPException(404, "Allocation not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(alloc, k, v)
    db.commit()
    db.refresh(alloc)
    return AllocationResponse(
        id=alloc.id,
        employee_id=alloc.employee_id,
        project_id=alloc.project_id,
        allocation_percent=alloc.allocation_percent,
        is_billable=alloc.is_billable,
        start_date=alloc.start_date,
        end_date=alloc.end_date,
        role_in_project=alloc.role_in_project,
        created_at=alloc.created_at,
        employee_name=f"{alloc.employee.first_name} {alloc.employee.last_name}" if alloc.employee else None,
        project_name=alloc.project.name if alloc.project else None,
    )
