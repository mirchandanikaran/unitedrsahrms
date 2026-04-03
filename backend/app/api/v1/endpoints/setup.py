"""First-run setup endpoints for empty deployments."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.employee import Department, Designation, Employee
from app.models.leave import LeaveType
from app.models.notification import Notification
from app.models.onboarding import OnboardingTemplate
from app.models.user import RoleEnum, User
from app.schemas.setup import (
    SetupInitializeRequest,
    SetupInitializeResponse,
    SetupStatusResponse,
)

router = APIRouter(prefix="/setup", tags=["setup"])


def _ensure_master_data(db: Session) -> None:
    if db.query(LeaveType).count() == 0:
        db.add_all(
            [
                LeaveType(name="Casual", code="CL", max_days_per_year=12, is_paid=1),
                LeaveType(name="Sick", code="SL", max_days_per_year=12, is_paid=1),
                LeaveType(name="Earned", code="EL", max_days_per_year=15, is_paid=1),
            ]
        )
    if db.query(OnboardingTemplate).count() == 0:
        db.add_all(
            [
                OnboardingTemplate(title="Submit ID proof & address proof", category="documents", order=1),
                OnboardingTemplate(title="Sign offer letter & NDA", category="documents", order=2),
                OnboardingTemplate(title="Submit bank account details", category="documents", order=3),
                OnboardingTemplate(title="Laptop / workstation setup", category="it_setup", order=4),
                OnboardingTemplate(title="Email & collaboration account creation", category="it_setup", order=5),
                OnboardingTemplate(title="HR policy orientation session", category="orientation", order=6),
            ]
        )
    db.commit()


@router.get("/status", response_model=SetupStatusResponse)
def setup_status(db: Session = Depends(get_db)):
    user_count = db.query(User).count()
    employee_count = db.query(Employee).count()
    return SetupStatusResponse(
        initialized=user_count > 0,
        user_count=user_count,
        employee_count=employee_count,
    )


@router.post("/initialize", response_model=SetupInitializeResponse)
def initialize_setup(data: SetupInitializeRequest, db: Session = Depends(get_db)):
    if db.query(User).count() > 0:
        raise HTTPException(409, "System is already initialized")

    department = (
        db.query(Department).filter(Department.code == data.department_code).first()
        or db.query(Department).filter(Department.name == data.department_name).first()
    )
    if not department:
        department = Department(
            name=data.department_name.strip(),
            code=data.department_code.strip().upper(),
            description="Initial department created during first-run setup",
        )
        db.add(department)
        db.commit()
        db.refresh(department)

    designation = db.query(Designation).filter(Designation.name == data.designation_name).first()
    if not designation:
        designation = Designation(name=data.designation_name.strip(), level=1)
        db.add(designation)
        db.commit()
        db.refresh(designation)

    admin_user = User(
        email=data.admin_email,
        hashed_password=get_password_hash(data.admin_password),
        role=RoleEnum.ADMIN,
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    admin_employee = Employee(
        user_id=admin_user.id,
        employee_code="ADM001",
        first_name=data.admin_first_name.strip(),
        last_name=data.admin_last_name.strip(),
        email=data.admin_email,
        date_of_joining=date.today(),
        department_id=department.id,
        designation_id=designation.id,
        status="active",
    )
    db.add(admin_employee)
    db.commit()

    _ensure_master_data(db)
    db.add(
        Notification(
            title="Welcome to Employee Management System",
            message="First-time setup completed. Start by adding employees and configuring holidays.",
            type="announcement",
            user_id=None,
        )
    )
    db.commit()

    return SetupInitializeResponse(
        message="Setup complete. You can now log in with your admin account.",
        admin_email=data.admin_email,
    )
