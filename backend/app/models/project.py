"""Project and Allocation models."""
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, index=True)
    description = Column(Text)
    client_name = Column(String(200))
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String(20), default="active")  # active, completed, on_hold
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    allocations = relationship("Allocation", back_populates="project")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    allocation_percent = Column(Float, default=0)
    is_billable = Column(Integer, default=1)  # 1=billable, 0=non-billable
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    role_in_project = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", backref="allocations")
    project = relationship("Project", back_populates="allocations")
