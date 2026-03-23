"""Social wall endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_db
from app.models.social import SocialComment, SocialPost, SocialReaction
from app.models.user import RoleEnum, User
from app.schemas.common import PaginatedResponse
from app.schemas.social import (
    SocialCommentCreate,
    SocialCommentResponse,
    SocialPostCreate,
    SocialPostResponse,
    SocialReactionToggleResponse,
)

router = APIRouter(prefix="/social", tags=["social"])


def _is_moderator(user: User) -> bool:
    return user.role in (RoleEnum.ADMIN, RoleEnum.HR)


def _display_name(employee) -> str:
    if not employee:
        return "Unknown"
    return f"{employee.first_name} {employee.last_name}"


def _to_comment_response(row: SocialComment, current_user: User) -> SocialCommentResponse:
    own_emp_id = current_user.employee.id if current_user.employee else None
    can_delete = bool(_is_moderator(current_user) or (own_emp_id and row.employee_id == own_emp_id))
    return SocialCommentResponse(
        id=row.id,
        post_id=row.post_id,
        employee_id=row.employee_id,
        employee_name=_display_name(row.employee),
        content=row.content,
        created_at=row.created_at,
        can_delete=can_delete,
    )


def _to_post_response(row: SocialPost, current_user: User) -> SocialPostResponse:
    own_emp_id = current_user.employee.id if current_user.employee else None
    like_count = len(row.reactions)
    is_liked_by_me = bool(own_emp_id and any(r.employee_id == own_emp_id for r in row.reactions))
    can_delete = bool(_is_moderator(current_user) or (own_emp_id and row.employee_id == own_emp_id))
    comments_sorted = sorted(row.comments, key=lambda c: c.created_at)
    return SocialPostResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=_display_name(row.employee),
        content=row.content,
        created_at=row.created_at,
        updated_at=row.updated_at,
        like_count=like_count,
        comment_count=len(row.comments),
        is_liked_by_me=is_liked_by_me,
        can_delete=can_delete,
        comments=[_to_comment_response(c, current_user) for c in comments_sorted],
    )


@router.get("/posts", response_model=PaginatedResponse[SocialPostResponse])
def list_posts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    q = db.query(SocialPost).options(
        joinedload(SocialPost.employee),
        joinedload(SocialPost.comments).joinedload(SocialComment.employee),
        joinedload(SocialPost.reactions),
    )
    total = q.count()
    rows = q.order_by(SocialPost.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    total_pages = (total + per_page - 1) // per_page
    return PaginatedResponse(
        items=[_to_post_response(r, current_user) for r in rows],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.post("/posts", response_model=SocialPostResponse)
def create_post(
    data: SocialPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.employee:
        raise HTTPException(400, "No employee profile linked")
    content = data.content.strip()
    if not content:
        raise HTTPException(400, "Post content is required")
    row = SocialPost(employee_id=current_user.employee.id, content=content)
    db.add(row)
    db.commit()
    db.refresh(row)
    row = (
        db.query(SocialPost)
        .options(
            joinedload(SocialPost.employee),
            joinedload(SocialPost.comments).joinedload(SocialComment.employee),
            joinedload(SocialPost.reactions),
        )
        .filter(SocialPost.id == row.id)
        .first()
    )
    return _to_post_response(row, current_user)


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not row:
        raise HTTPException(404, "Post not found")
    own_emp_id = current_user.employee.id if current_user.employee else None
    if not _is_moderator(current_user) and (not own_emp_id or row.employee_id != own_emp_id):
        raise HTTPException(403, "You can delete only your own post")
    db.delete(row)
    db.commit()
    return {"message": "Post deleted", "id": post_id}


@router.post("/posts/{post_id}/like", response_model=SocialReactionToggleResponse)
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.employee:
        raise HTTPException(400, "No employee profile linked")
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    existing = (
        db.query(SocialReaction)
        .filter(
            SocialReaction.post_id == post_id,
            SocialReaction.employee_id == current_user.employee.id,
        )
        .first()
    )
    liked = False
    if existing:
        db.delete(existing)
    else:
        db.add(SocialReaction(post_id=post_id, employee_id=current_user.employee.id, reaction_type="like"))
        liked = True
    db.commit()
    like_count = db.query(SocialReaction).filter(SocialReaction.post_id == post_id).count()
    return SocialReactionToggleResponse(liked=liked, like_count=like_count)


@router.post("/posts/{post_id}/comments", response_model=SocialCommentResponse)
def add_comment(
    post_id: int,
    data: SocialCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.employee:
        raise HTTPException(400, "No employee profile linked")
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    content = data.content.strip()
    if not content:
        raise HTTPException(400, "Comment content is required")
    row = SocialComment(post_id=post_id, employee_id=current_user.employee.id, content=content)
    db.add(row)
    db.commit()
    db.refresh(row)
    row = db.query(SocialComment).options(joinedload(SocialComment.employee)).filter(SocialComment.id == row.id).first()
    return _to_comment_response(row, current_user)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = db.query(SocialComment).filter(SocialComment.id == comment_id).first()
    if not row:
        raise HTTPException(404, "Comment not found")
    own_emp_id = current_user.employee.id if current_user.employee else None
    if not _is_moderator(current_user) and (not own_emp_id or row.employee_id != own_emp_id):
        raise HTTPException(403, "You can delete only your own comment")
    db.delete(row)
    db.commit()
    return {"message": "Comment deleted", "id": comment_id}
