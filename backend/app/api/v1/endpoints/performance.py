"""Performance review and goals endpoints."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_admin_or_hr, get_manager_or_above
from app.models.user import User
from app.models.performance import PerformanceReview, Goal
from app.schemas.performance import GoalCreate, GoalUpdate, PerformanceReviewCreate, PerformanceReviewUpdate

router = APIRouter(prefix="/performance", tags=["performance"])


@router.get("/goals")
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    employee_id: Optional[int] = None,
):
    q = db.query(Goal).options(joinedload(Goal.employee))
    if employee_id:
        q = q.filter(Goal.employee_id == employee_id)
    elif current_user.role.value == "employee" and current_user.employee:
        q = q.filter(Goal.employee_id == current_user.employee.id)
    return q.order_by(Goal.created_at.desc()).all()


@router.post("/goals")
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    goal = Goal(**data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/goals/{goal_id}")
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)
    db.commit()
    db.refresh(goal)
    return goal


@router.get("/reviews")
def list_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
    employee_id: Optional[int] = None,
):
    q = db.query(PerformanceReview).options(
        joinedload(PerformanceReview.employee),
        joinedload(PerformanceReview.reviewed_by),
    )
    if employee_id:
        q = q.filter(PerformanceReview.employee_id == employee_id)
    elif current_user.role.value == "employee" and current_user.employee:
        q = q.filter(PerformanceReview.employee_id == current_user.employee.id)
    return q.order_by(PerformanceReview.review_period_end.desc()).all()


@router.post("/reviews")
def create_review(
    data: PerformanceReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_above),
):
    review = PerformanceReview(**data.model_dump())
    review.reviewed_by_id = current_user.employee.id if current_user.employee else None
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.put("/reviews/{review_id}")
def update_review(
    review_id: int,
    data: PerformanceReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_manager_or_above),
):
    from datetime import datetime as dt
    review = db.query(PerformanceReview).filter(PerformanceReview.id == review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(review, k, v)
    review.reviewed_at = dt.utcnow()
    review.reviewed_by_id = current_user.employee.id if current_user.employee else None
    db.commit()
    db.refresh(review)
    return review
