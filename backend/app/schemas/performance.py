"""Performance schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class GoalCreate(BaseModel):
    employee_id: int
    title: str
    description: str | None = None
    target_date: date | None = None
    weight: float = 1.0


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target_date: date | None = None
    status: str | None = None
    weight: float | None = None


class PerformanceReviewCreate(BaseModel):
    employee_id: int
    review_period_start: date
    review_period_end: date
    rating: float | None = None
    comments: str | None = None


class PerformanceReviewUpdate(BaseModel):
    rating: float | None = None
    comments: str | None = None
