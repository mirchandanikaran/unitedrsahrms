"""First-run setup schemas."""
from pydantic import BaseModel, EmailStr, Field


class SetupStatusResponse(BaseModel):
    initialized: bool
    user_count: int
    employee_count: int


class SetupInitializeRequest(BaseModel):
    admin_first_name: str = Field(min_length=1, max_length=100)
    admin_last_name: str = Field(min_length=1, max_length=100)
    admin_email: EmailStr
    admin_password: str = Field(min_length=8, max_length=128)
    department_name: str = Field(default="Administration", min_length=1, max_length=100)
    department_code: str = Field(default="ADM", min_length=1, max_length=20)
    designation_name: str = Field(default="Administrator", min_length=1, max_length=100)


class SetupInitializeResponse(BaseModel):
    message: str
    admin_email: EmailStr
