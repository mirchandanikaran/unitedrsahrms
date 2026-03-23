"""Social wall schemas."""
from datetime import datetime

from pydantic import BaseModel


class SocialPostCreate(BaseModel):
    content: str


class SocialCommentCreate(BaseModel):
    content: str


class SocialCommentResponse(BaseModel):
    id: int
    post_id: int
    employee_id: int
    employee_name: str
    content: str
    created_at: datetime
    can_delete: bool = False


class SocialPostResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    content: str
    created_at: datetime
    updated_at: datetime
    like_count: int
    comment_count: int
    is_liked_by_me: bool = False
    can_delete: bool = False
    comments: list[SocialCommentResponse]


class SocialReactionToggleResponse(BaseModel):
    liked: bool
    like_count: int
