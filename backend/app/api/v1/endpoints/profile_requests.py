"""Profile update request endpoints - employee self-service with approval."""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_admin_or_hr, get_current_user
from app.models.user import User
from app.models.employee import Employee
from app.models.profile_request import ProfileUpdateRequest
from app.schemas.profile_request import (
    ProfileUpdateCreate,
    ProfileUpdateReview,
    ProfileUpdateResponse,
)

router = APIRouter(prefix="/profile-requests", tags=["profile-requests"])

EDITABLE_FIELDS = {"phone", "address", "emergency_contact", "date_of_birth"}


@router.post("", response_model=ProfileUpdateResponse)
def create_profile_request(
    data: ProfileUpdateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Employee submits a request to update their own profile field."""
    if not current_user.employee:
        raise HTTPException(400, "No employee profile linked")
    if data.field_name not in EDITABLE_FIELDS:
        raise HTTPException(400, f"Field '{data.field_name}' is not self-editable. Allowed: {EDITABLE_FIELDS}")

    emp = current_user.employee
    old_value = str(getattr(emp, data.field_name, "") or "")

    req = ProfileUpdateRequest(
        employee_id=emp.id,
        field_name=data.field_name,
        old_value=old_value,
        new_value=data.new_value,
        status="pending",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return ProfileUpdateResponse(
        id=req.id,
        employee_id=req.employee_id,
        field_name=req.field_name,
        old_value=req.old_value,
        new_value=req.new_value,
        status=req.status,
        created_at=req.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}",
    )


@router.get("", response_model=list[ProfileUpdateResponse])
def list_profile_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[str] = None,
    employee_id: Optional[int] = None,
):
    q = db.query(ProfileUpdateRequest)

    if current_user.role.value in ["admin", "hr"]:
        if employee_id:
            q = q.filter(ProfileUpdateRequest.employee_id == employee_id)
    else:
        if not current_user.employee:
            return []
        q = q.filter(ProfileUpdateRequest.employee_id == current_user.employee.id)

    if status_filter:
        q = q.filter(ProfileUpdateRequest.status == status_filter)

    items = q.order_by(ProfileUpdateRequest.created_at.desc()).limit(100).all()
    result = []
    for r in items:
        emp = db.query(Employee).filter(Employee.id == r.employee_id).first()
        result.append(
            ProfileUpdateResponse(
                id=r.id,
                employee_id=r.employee_id,
                field_name=r.field_name,
                old_value=r.old_value,
                new_value=r.new_value,
                status=r.status,
                reviewed_by_id=r.reviewed_by_id,
                reviewed_at=r.reviewed_at,
                rejection_reason=r.rejection_reason,
                created_at=r.created_at,
                employee_name=f"{emp.first_name} {emp.last_name}" if emp else None,
            )
        )
    return result


@router.put("/{request_id}/review", response_model=ProfileUpdateResponse)
def review_profile_request(
    request_id: int,
    data: ProfileUpdateReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    req = db.query(ProfileUpdateRequest).filter(ProfileUpdateRequest.id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status != "pending":
        raise HTTPException(400, "Request already reviewed")

    req.status = data.status
    req.reviewed_by_id = current_user.employee.id if current_user.employee else None
    req.reviewed_at = datetime.utcnow()
    if data.rejection_reason:
        req.rejection_reason = data.rejection_reason

    if data.status == "approved":
        emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
        if emp and hasattr(emp, req.field_name):
            setattr(emp, req.field_name, req.new_value)

    db.commit()
    db.refresh(req)
    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    return ProfileUpdateResponse(
        id=req.id,
        employee_id=req.employee_id,
        field_name=req.field_name,
        old_value=req.old_value,
        new_value=req.new_value,
        status=req.status,
        reviewed_by_id=req.reviewed_by_id,
        reviewed_at=req.reviewed_at,
        rejection_reason=req.rejection_reason,
        created_at=req.created_at,
        employee_name=f"{emp.first_name} {emp.last_name}" if emp else None,
    )
