"""User schemas."""
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import RoleEnum


class UserBase(BaseModel):
    email: EmailStr
    role: RoleEnum = RoleEnum.EMPLOYEE
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: RoleEnum | None = None
    is_active: bool | None = None
    password: str | None = None


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
