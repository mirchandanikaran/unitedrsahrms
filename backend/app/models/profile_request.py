"""Profile update request models for employee self-service with approval flow."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class ProfileUpdateRequest(Base):
    __tablename__ = "profile_update_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    field_name = Column(String(50), nullable=False)  # phone, address, emergency_contact, etc.
    old_value = Column(Text)
    new_value = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reviewed_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id])
    reviewed_by = relationship("Employee", foreign_keys=[reviewed_by_id])
