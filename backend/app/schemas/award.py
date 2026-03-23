"""Award badge schemas."""
from datetime import date, datetime

from pydantic import BaseModel


class AwardBadgeCreate(BaseModel):
    employee_id: int
    title: str
    badge_type: str = "Appreciation"
    description: str | None = None
    awarded_on: date | None = None


class AwardBadgeResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    title: str
    badge_type: str
    description: str | None = None
    awarded_on: date
    awarded_by_id: int | None = None
    awarded_by_name: str | None = None
    created_at: datetime


class AwardBadgeDeleteResponse(BaseModel):
    message: str
    id: int
