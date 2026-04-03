"""Initialize database with master data only (no dummy users/employees)."""
import sys
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.database import SessionLocal, init_db
from app.models.leave import LeaveType
from app.models.onboarding import OnboardingTemplate


def seed():
    db = SessionLocal()
    try:
        init_db()

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
        print("No demo users or employees were created.")
        print("Complete first-time setup at /setup to create your admin account.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
