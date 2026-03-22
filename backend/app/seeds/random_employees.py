"""Generate random employee rows (shared by seed_data.py and CLI script)."""
from __future__ import annotations

import random
from datetime import date, timedelta
from typing import TYPE_CHECKING

from sqlalchemy.orm import Session

from app.models.employee import Employee, Department, Designation

if TYPE_CHECKING:
    pass

FIRST_NAMES = [
    "Aarav", "Aditi", "Arjun", "Ananya", "Dhruv", "Diya", "Ishaan", "Kavya", "Kabir", "Meera",
    "Neha", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Riya", "Rohan", "Sanjay", "Sneha",
    "Tanvi", "Varun", "Vidya", "Vikram", "Yash", "Zara", "Omar", "Liam", "Emma", "Noah",
    "Olivia", "Mason", "Sophia", "Lucas", "Amelia", "Ethan", "Harper", "James", "Evelyn",
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Kapoor", "Malhotra", "Bansal", "Chopra",
    "Joshi", "Kulkarni", "Desai", "Menon", "Rao", "Mehta", "Singh", "Khan", "Das", "Ghosh",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Taylor",
]

# Synthetic directory rows inserted by scripts/seed_data.py (5 linked demo users are created separately).
SEED_RANDOM_EMPLOYEE_COUNT = 100


def random_join_date(rng: random.Random) -> date:
    end = date.today()
    start = end - timedelta(days=365 * 8)
    delta = (end - start).days
    return start + timedelta(days=rng.randint(0, max(delta, 1)))


def random_phone(rng: random.Random) -> str:
    return f"+91{rng.randint(6, 9)}{rng.randint(100000000, 999999999)}"


def add_random_employees(db: Session, count: int = 50, rng: random.Random | None = None) -> int:
    """
    Insert `count` random employees. Does not commit.
    Requires departments and designations, and at least one employee for manager fallback.
    """
    if count < 1:
        return 0
    if rng is None:
        rng = random.Random()

    departments = db.query(Department).all()
    designations = db.query(Designation).all()
    if not departments or not designations:
        return 0

    dept_ids = [d.id for d in departments]
    line_desig_ids = [d.id for d in designations if d.level > 1] or [d.id for d in designations]

    mgr_candidates = (
        db.query(Employee.id)
        .join(Designation, Employee.designation_id == Designation.id)
        .filter(Designation.name.in_(["Manager", "CEO"]))
        .filter(Employee.status == "active")
        .all()
    )
    manager_ids = [row[0] for row in mgr_candidates]
    if not manager_ids:
        any_emp = db.query(Employee.id).filter(Employee.status == "active").first()
        manager_ids = [any_emp[0]] if any_emp else []

    existing_codes = {row[0] for row in db.query(Employee.employee_code).all()}
    n = 1
    created = 0
    while created < count:
        code = f"GEN{n:05d}"
        n += 1
        if code in existing_codes:
            continue

        fn = rng.choice(FIRST_NAMES)
        ln = rng.choice(LAST_NAMES)
        email = f"{fn.lower()}.{ln.lower()}.{code.lower()}@demo.generated"

        if db.query(Employee).filter(Employee.email == email).first():
            email = f"{fn.lower()}.{ln.lower()}.{rng.randint(1000, 9999)}@demo.generated"

        dept_id = rng.choice(dept_ids)
        desig_id = rng.choice(line_desig_ids)
        mgr_id = None
        if manager_ids and rng.random() < 0.75:
            mgr_id = rng.choice(manager_ids)

        emp = Employee(
            employee_code=code,
            first_name=fn,
            last_name=ln,
            email=email,
            phone=random_phone(rng),
            date_of_joining=random_join_date(rng),
            department_id=dept_id,
            designation_id=desig_id,
            manager_id=mgr_id,
            status="active",
            user_id=None,
            address=f"{rng.randint(1, 999)} Demo Street, City {rng.randint(1, 99)}",
            emergency_contact=random_phone(rng),
        )
        db.add(emp)
        existing_codes.add(code)
        created += 1

    return created
