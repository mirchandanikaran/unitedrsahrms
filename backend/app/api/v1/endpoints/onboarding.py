"""Onboarding checklist endpoints."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_admin_or_hr, get_current_user
from app.models.user import User
from app.models.employee import Employee
from app.models.onboarding import OnboardingTemplate, OnboardingItem
from app.schemas.onboarding import (
    OnboardingTemplateCreate,
    OnboardingTemplateResponse,
    OnboardingItemResponse,
    OnboardingItemUpdate,
)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.get("/templates", response_model=list[OnboardingTemplateResponse])
def list_templates(db: Session = Depends(get_db), _: User = Depends(get_admin_or_hr)):
    return db.query(OnboardingTemplate).order_by(OnboardingTemplate.order, OnboardingTemplate.id).all()


@router.post("/templates", response_model=OnboardingTemplateResponse)
def create_template(
    data: OnboardingTemplateCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    t = OnboardingTemplate(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    t = db.query(OnboardingTemplate).filter(OnboardingTemplate.id == template_id).first()
    if not t:
        raise HTTPException(404, "Template not found")
    db.delete(t)
    db.commit()
    return {"message": "Template deleted"}


@router.post("/initialize/{employee_id}")
def initialize_onboarding(
    employee_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    """Create onboarding items for an employee from all templates."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    existing = db.query(OnboardingItem).filter(OnboardingItem.employee_id == employee_id).count()
    if existing > 0:
        raise HTTPException(400, "Onboarding already initialized for this employee")

    templates = db.query(OnboardingTemplate).order_by(OnboardingTemplate.order).all()
    if not templates:
        raise HTTPException(400, "No onboarding templates defined. Create templates first.")

    items = []
    for t in templates:
        item = OnboardingItem(template_id=t.id, employee_id=employee_id, status="pending")
        db.add(item)
        items.append(item)
    db.commit()
    return {"message": f"Onboarding initialized with {len(items)} items", "employee_id": employee_id}


@router.get("/items", response_model=list[OnboardingItemResponse])
def list_onboarding_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    employee_id: Optional[int] = None,
):
    emp_id = employee_id
    if not emp_id and current_user.employee:
        emp_id = current_user.employee.id
    if not emp_id:
        if current_user.role.value in ["admin", "hr"]:
            return []
        raise HTTPException(400, "employee_id required")

    items = (
        db.query(OnboardingItem)
        .options(joinedload(OnboardingItem.template))
        .filter(OnboardingItem.employee_id == emp_id)
        .all()
    )
    return [
        OnboardingItemResponse(
            id=i.id,
            template_id=i.template_id,
            employee_id=i.employee_id,
            status=i.status,
            completed_at=i.completed_at,
            completed_by_id=i.completed_by_id,
            notes=i.notes,
            created_at=i.created_at,
            template_title=i.template.title if i.template else None,
            template_category=i.template.category if i.template else None,
        )
        for i in items
    ]


@router.put("/items/{item_id}", response_model=OnboardingItemResponse)
def update_onboarding_item(
    item_id: int,
    data: OnboardingItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(OnboardingItem)
        .options(joinedload(OnboardingItem.template))
        .filter(OnboardingItem.id == item_id)
        .first()
    )
    if not item:
        raise HTTPException(404, "Item not found")

    if data.status:
        item.status = data.status
        if data.status == "completed":
            item.completed_at = datetime.utcnow()
            item.completed_by_id = current_user.employee.id if current_user.employee else None
    if data.notes is not None:
        item.notes = data.notes
    db.commit()
    db.refresh(item)
    return OnboardingItemResponse(
        id=item.id,
        template_id=item.template_id,
        employee_id=item.employee_id,
        status=item.status,
        completed_at=item.completed_at,
        completed_by_id=item.completed_by_id,
        notes=item.notes,
        created_at=item.created_at,
        template_title=item.template.title if item.template else None,
        template_category=item.template.category if item.template else None,
    )
