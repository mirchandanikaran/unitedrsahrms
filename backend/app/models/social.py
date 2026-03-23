"""Social wall models (posts, comments, reactions)."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class SocialPost(Base):
    __tablename__ = "social_posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id])
    comments = relationship("SocialComment", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("SocialReaction", back_populates="post", cascade="all, delete-orphan")


class SocialComment(Base):
    __tablename__ = "social_comments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("SocialPost", back_populates="comments")
    employee = relationship("Employee", foreign_keys=[employee_id])


class SocialReaction(Base):
    __tablename__ = "social_reactions"
    __table_args__ = (UniqueConstraint("post_id", "employee_id", name="uq_social_reaction_post_employee"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    post_id = Column(Integer, ForeignKey("social_posts.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    reaction_type = Column(String(20), nullable=False, default="like")
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("SocialPost", back_populates="reactions")
    employee = relationship("Employee", foreign_keys=[employee_id])
