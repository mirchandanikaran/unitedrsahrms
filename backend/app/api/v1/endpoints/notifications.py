"""Notifications endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_admin_or_hr, get_current_user
from app.models.user import User
from app.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unread_only: bool = False,
    limit: int = 50,
):
    q = db.query(Notification).filter(
        (Notification.user_id == current_user.id) | (Notification.user_id.is_(None))
    )
    if unread_only:
        q = q.filter(Notification.is_read == 0)
    return q.order_by(Notification.created_at.desc()).limit(limit).all()


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif and (notif.user_id == current_user.id or notif.user_id is None):
        notif.is_read = 1
        db.commit()
    return {"success": True}


class NotifCreate(BaseModel):
    title: str
    message: str | None = None
    type: str = "announcement"
    user_id: int | None = None


@router.post("")
def create_announcement(
    data: NotifCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_hr),
):
    notif = Notification(
        title=data.title,
        message=data.message,
        type=data.type,
        user_id=data.user_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
