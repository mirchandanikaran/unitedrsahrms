"""Onboarding checklist models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class OnboardingTemplate(Base):
    __tablename__ = "onboarding_templates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # documents, it_setup, orientation, hr_formalities
    description = Column(Text)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("OnboardingItem", back_populates="template", cascade="all, delete-orphan")


class OnboardingItem(Base):
    __tablename__ = "onboarding_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    template_id = Column(Integer, ForeignKey("onboarding_templates.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, completed, skipped
    completed_at = Column(DateTime, nullable=True)
    completed_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("OnboardingTemplate", back_populates="items")
    employee = relationship("Employee", foreign_keys=[employee_id])
    completed_by = relationship("Employee", foreign_keys=[completed_by_id])
