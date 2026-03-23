"""Employee award badge model."""
from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class AwardBadge(Base):
    __tablename__ = "award_badges"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    badge_type = Column(String(50), nullable=False, default="Appreciation")
    description = Column(Text, nullable=True)
    awarded_on = Column(Date, nullable=False, default=date.today)
    awarded_by_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id], backref="award_badges")
    awarded_by = relationship("Employee", foreign_keys=[awarded_by_id])
