"""Profile update request schemas."""
from datetime import datetime
from pydantic import BaseModel


class ProfileUpdateCreate(BaseModel):
    field_name: str
    new_value: str


class ProfileUpdateReview(BaseModel):
    status: str  # approved, rejected
    rejection_reason: str | None = None


class ProfileUpdateResponse(BaseModel):
    id: int
    employee_id: int
    field_name: str
    old_value: str | None = None
    new_value: str
    status: str
    reviewed_by_id: int | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    employee_name: str | None = None

    class Config:
        from_attributes = True
