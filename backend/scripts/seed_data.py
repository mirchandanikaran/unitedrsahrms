"""Seed database with sample data."""
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from datetime import date, datetime, time, timedelta
from app.db.database import SessionLocal, init_db
from app.models.user import User, RoleEnum
from app.models.employee import Employee, Department, Designation
from app.models.attendance import Attendance
from app.models.leave import LeaveType, Leave, Holiday
from app.models.project import Project, Allocation
from app.models.performance import Goal, PerformanceReview
from app.models.notification import Notification
from app.core.security import get_password_hash


def seed():
    db = SessionLocal()
    try:
        init_db()

        # Skip if already seeded
        if db.query(User).first():
            print("Data already exists. Skipping seed.")
            return

        # Departments
        depts = [
            Department(name="Engineering", code="ENG", description="Software Development"),
            Department(name="Human Resources", code="HR", description="HR Operations"),
            Department(name="Operations", code="OPS", description="Operations"),
        ]
        for d in depts:
            db.add(d)
        db.commit()
        for d in depts:
            db.refresh(d)

        # Designations
        designations = [
            Designation(name="CEO", level=1),
            Designation(name="Manager", level=2),
            Designation(name="Senior Engineer", level=3),
            Designation(name="Engineer", level=4),
            Designation(name="HR Executive", level=4),
        ]
        for des in designations:
            db.add(des)
        db.commit()
        for des in designations:
            db.refresh(des)

        # Users
        default_password = get_password_hash("password123")
        users_data = [
            ("admin@hrms.com", RoleEnum.ADMIN),
            ("hr@hrms.com", RoleEnum.HR),
            ("manager@hrms.com", RoleEnum.MANAGER),
            ("employee@hrms.com", RoleEnum.EMPLOYEE),
            ("leadership@hrms.com", RoleEnum.LEADERSHIP),
        ]
        users = []
        for email, role in users_data:
            u = User(email=email, hashed_password=default_password, role=role)
            db.add(u)
            db.commit()
            db.refresh(u)
            users.append(u)

        # Employees
        employees_data = [
            ("EMP001", "John", "Smith", "admin@hrms.com", 1, 1, None, "2020-01-01"),
            ("EMP002", "Jane", "Doe", "hr@hrms.com", 2, 5, 1, "2021-03-15"),
            ("EMP003", "Bob", "Manager", "manager@hrms.com", 1, 2, 1, "2019-06-01"),
            ("EMP004", "Alice", "Engineer", "employee@hrms.com", 1, 4, 3, "2022-01-10"),
            ("EMP005", "Charlie", "Leadership", "leadership@hrms.com", 1, 2, 1, "2018-01-01"),
        ]
        emps = []
        for i, (code, fn, ln, email, dept_id, desig_id, mgr_id, doj) in enumerate(employees_data):
            user_id = users[i].id if i < len(users) else None
            e = Employee(
                employee_code=code,
                first_name=fn,
                last_name=ln,
                email=email,
                department_id=dept_id,
                designation_id=desig_id,
                manager_id=mgr_id,
                date_of_joining=datetime.strptime(doj, "%Y-%m-%d").date(),
                status="active",
                user_id=user_id,
            )
            db.add(e)
            db.commit()
            db.refresh(e)
            emps.append(e)
        db.commit()

        # Leave types
        leave_types = [
            LeaveType(name="Casual", code="CL", max_days_per_year=12, is_paid=1),
            LeaveType(name="Sick", code="SL", max_days_per_year=12, is_paid=1),
            LeaveType(name="Earned", code="EL", max_days_per_year=15, is_paid=1),
        ]
        for lt in leave_types:
            db.add(lt)
        db.commit()
        for lt in leave_types:
            db.refresh(lt)

        # Holidays 2025
        holidays = [
            ("New Year", date(2025, 1, 1), 2025),
            ("Republic Day", date(2025, 1, 26), 2025),
            ("Holi", date(2025, 3, 14), 2025),
            ("Independence Day", date(2025, 8, 15), 2025),
        ]
        for name, d, yr in holidays:
            db.add(Holiday(name=name, date=d, year=yr))
        db.commit()

        # Sample attendance
        today = date.today()
        for emp in emps[:4]:  # First 4 employees
            for d in range(10):
                dte = today - timedelta(days=d)
                att = Attendance(
                    employee_id=emp.id,
                    date=dte,
                    status="present" if d % 7 not in (5, 6) else "absent",
                )
                db.add(att)
        db.commit()

        # Sample leave
        leave = Leave(
            employee_id=emps[3].id,
            leave_type_id=1,
            start_date=today - timedelta(days=5),
            end_date=today - timedelta(days=4),
            days=2,
            reason="Personal",
            status="approved",
            approved_by_id=emps[2].id,
            approved_at=datetime.utcnow(),
        )
        db.add(leave)
        db.commit()

        # Projects
        projects = [
            Project(name="Client A - Web App", code="CA-WEB", status="active"),
            Project(name="Internal - HRMS", code="INT-HRMS", status="active"),
        ]
        for p in projects:
            db.add(p)
        db.commit()
        for p in projects:
            db.refresh(p)

        # Allocations
        allocs = [
            (emps[3].id, projects[0].id, 80, 1),
            (emps[3].id, projects[1].id, 20, 0),
        ]
        for emp_id, proj_id, pct, bill in allocs:
            db.add(Allocation(
                employee_id=emp_id,
                project_id=proj_id,
                allocation_percent=pct,
                is_billable=bill,
                start_date=today - timedelta(days=30),
            ))
        db.commit()

        # Notification
        db.add(Notification(title="Welcome to HRMS", message="System is ready.", type="announcement"))
        db.commit()

        print("Seed data created successfully!")
        print("Login with: admin@hrms.com / password123 (or hr@hrms.com, manager@hrms.com, employee@hrms.com, leadership@hrms.com)")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
