"""Leave and Holiday models."""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False)  # casual, sick, earned, etc.
    code = Column(String(20), unique=True)
    max_days_per_year = Column(Float, default=0)  # 0 = unlimited
    is_paid = Column(Integer, default=1)  # 1=paid, 0=unpaid
    probation_months = Column(Integer, default=0)  # months of service required before this type is available; 0=no restriction
    created_at = Column(DateTime, default=datetime.utcnow)


class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Float, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    approved_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id])
    leave_type = relationship("LeaveType", backref="leaves")
    approved_by = relationship("Employee", foreign_keys=[approved_by_id])


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    is_optional = Column(Integer, default=0)  # 0=mandatory, 1=optional
    region = Column(String(50), nullable=True, index=True)  # e.g. "IN-MH", "IN-KA", "US-CA", None=global
    created_at = Column(DateTime, default=datetime.utcnow)


class EmployeeLeaveBalance(Base):
    """Manual leave balance overrides per employee/type/year."""
    __tablename__ = "employee_leave_balances"
    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_emp_leave_balance"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    total_days = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", backref="leave_balance_overrides")
    leave_type = relationship("LeaveType", backref="employee_overrides")
