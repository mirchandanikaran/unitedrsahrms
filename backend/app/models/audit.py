"""Audit log model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.db.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))  # employee, attendance, leave, etc.
    entity_id = Column(Integer)
    old_values = Column(Text)  # JSON
    new_values = Column(Text)  # JSON
    ip_address = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
