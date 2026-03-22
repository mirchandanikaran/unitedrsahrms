"""Onboarding schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class OnboardingTemplateCreate(BaseModel):
    title: str
    category: str
    description: str | None = None
    order: int = 0


class OnboardingTemplateResponse(BaseModel):
    id: int
    title: str
    category: str
    description: str | None = None
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class OnboardingItemResponse(BaseModel):
    id: int
    template_id: int
    employee_id: int
    status: str
    completed_at: datetime | None = None
    completed_by_id: int | None = None
    notes: str | None = None
    created_at: datetime
    template_title: str | None = None
    template_category: str | None = None

    class Config:
        from_attributes = True


class OnboardingItemUpdate(BaseModel):
    status: str | None = None
    notes: str | None = None
