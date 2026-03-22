"""Notification model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)  # null = broadcast
    title = Column(String(200), nullable=False)
    message = Column(Text)
    type = Column(String(50), default="info")  # info, alert, announcement
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    link = Column(String(500))  # Optional action link
