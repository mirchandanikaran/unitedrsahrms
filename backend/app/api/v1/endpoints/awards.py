"""Award badge endpoints."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_admin_or_hr, get_current_user, get_db
from app.models.award import AwardBadge
from app.models.employee import Employee
from app.models.user import RoleEnum, User
from app.schemas.award import AwardBadgeCreate, AwardBadgeDeleteResponse, AwardBadgeResponse

router = APIRouter(prefix="/awards", tags=["awards"])


def _to_response(row: AwardBadge) -> AwardBadgeResponse:
    employee_name = "Unknown"
    if row.employee:
        employee_name = f"{row.employee.first_name} {row.employee.last_name}"
    awarded_by_name = None
    if row.awarded_by:
        awarded_by_name = f"{row.awarded_by.first_name} {row.awarded_by.last_name}"
    return AwardBadgeResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=employee_name,
        title=row.title,
        badge_type=row.badge_type,
        description=row.description,
        awarded_on=row.awarded_on,
        awarded_by_id=row.awarded_by_id,
        awarded_by_name=awarded_by_name,
        created_at=row.created_at,
    )


@router.get("", response_model=list[AwardBadgeResponse])
def list_awards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    employee_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    q = db.query(AwardBadge).options(
        joinedload(AwardBadge.employee),
        joinedload(AwardBadge.awarded_by),
    )
    if current_user.role in (RoleEnum.ADMIN, RoleEnum.HR):
        if employee_id:
            q = q.filter(AwardBadge.employee_id == employee_id)
    else:
        if not current_user.employee:
            return []
        own_emp_id = current_user.employee.id
        if employee_id and employee_id != own_emp_id:
            raise HTTPException(403, "You can only view your own award badges")
        q = q.filter(AwardBadge.employee_id == own_emp_id)
    rows = q.order_by(AwardBadge.awarded_on.desc(), AwardBadge.created_at.desc()).limit(limit).all()
    return [_to_response(r) for r in rows]


@router.post("", response_model=AwardBadgeResponse)
def create_award(
    data: AwardBadgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    emp = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    row = AwardBadge(
        employee_id=data.employee_id,
        title=data.title.strip(),
        badge_type=data.badge_type.strip() if data.badge_type else "Appreciation",
        description=data.description.strip() if data.description else None,
        awarded_on=data.awarded_on or date.today(),
        awarded_by_id=current_user.employee.id if current_user.employee else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    row = (
        db.query(AwardBadge)
        .options(joinedload(AwardBadge.employee), joinedload(AwardBadge.awarded_by))
        .filter(AwardBadge.id == row.id)
        .first()
    )
    return _to_response(row)


@router.delete("/{award_id}", response_model=AwardBadgeDeleteResponse)
def delete_award(
    award_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_or_hr),
):
    row = db.query(AwardBadge).filter(AwardBadge.id == award_id).first()
    if not row:
        raise HTTPException(404, "Award badge not found")
    db.delete(row)
    db.commit()
    return AwardBadgeDeleteResponse(message="Award badge removed", id=award_id)
