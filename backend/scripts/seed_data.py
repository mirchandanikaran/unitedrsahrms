"""Initialize database with master data and a default admin account."""
import sys
import os
from datetime import date
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.security import get_password_hash
from app.db.database import SessionLocal, init_db
from app.models.employee import Department, Designation, Employee
from app.models.leave import LeaveType
from app.models.onboarding import OnboardingTemplate
from app.models.user import RoleEnum, User
from sqlalchemy.orm import Session


DEFAULT_ADMIN_EMAIL = os.getenv("HRMS_ADMIN_EMAIL", "admin@hrms.com").strip().lower()
DEFAULT_ADMIN_PASSWORD = os.getenv("HRMS_ADMIN_PASSWORD", "Admin@123")
DEFAULT_ADMIN_FIRST_NAME = os.getenv("HRMS_ADMIN_FIRST_NAME", "System")
DEFAULT_ADMIN_LAST_NAME = os.getenv("HRMS_ADMIN_LAST_NAME", "Admin")


def _next_admin_employee_code(db: Session) -> str:
    idx = 1
    while True:
        code = f"ADM{idx:03d}"
        exists = db.query(Employee.id).filter(Employee.employee_code == code).first()
        if not exists:
            return code
        idx += 1


def _ensure_admin_entities(db: Session) -> bool:
    if db.query(User).count() > 0:
        return False

    department = db.query(Department).filter(Department.code == "ADM").first()
    if not department:
        department = db.query(Department).filter(Department.name == "Administration").first()
    if not department:
        department = Department(name="Administration", code="ADM", description="Default admin department")
        db.add(department)
        db.flush()

    designation = db.query(Designation).filter(Designation.name == "Administrator").first()
    if not designation:
        designation = Designation(name="Administrator", level=1)
        db.add(designation)
        db.flush()

    admin_user = User(
        email=DEFAULT_ADMIN_EMAIL,
        hashed_password=get_password_hash(DEFAULT_ADMIN_PASSWORD),
        role=RoleEnum.ADMIN,
        is_active=True,
    )
    db.add(admin_user)
    db.flush()

    employee_email = DEFAULT_ADMIN_EMAIL
    if db.query(Employee.id).filter(Employee.email == employee_email).first():
        employee_email = "admin.employee@hrms.com"

    db.add(
        Employee(
            user_id=admin_user.id,
            employee_code=_next_admin_employee_code(db),
            first_name=DEFAULT_ADMIN_FIRST_NAME,
            last_name=DEFAULT_ADMIN_LAST_NAME,
            email=employee_email,
            date_of_joining=date.today(),
            department_id=department.id,
            designation_id=designation.id,
            status="active",
        )
    )
    return True


def seed():
    db = SessionLocal()
    try:
        init_db()
        admin_created = _ensure_admin_entities(db)

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
        print("Master data initialized.")
        if admin_created:
            print(f"Admin login email: {DEFAULT_ADMIN_EMAIL}")
            print(f"Admin login password: {DEFAULT_ADMIN_PASSWORD}")
        else:
            print("Users already exist, so no default admin account was created.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
