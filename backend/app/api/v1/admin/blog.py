"""Router quản trị Blog (M3): danh mục, bài viết, workflow trạng thái."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_permission
from app.schemas.blog import (
    CategoryCreate,
    CategoryOut,
    PostAdminDetail,
    PostCreate,
    PostListItem,
    PostUpdate,
    StatusUpdate,
)
from app.schemas.common import ApiResponse
from app.services.blog_service import BlogService

router = APIRouter(prefix="/admin/blog", tags=["admin:blog"])


def _to_admin_detail(post) -> PostAdminDetail:
    return PostAdminDetail(
        id=post.id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        content=post.content,
        cover_image_url=post.cover_image_url,
        status=post.status,
        category=post.category,
        author_name=post.author.full_name,
        tags=post.tags,
        published_at=post.published_at,
        view_count=post.view_count,
        seo_title=post.seo_title,
        seo_description=post.seo_description,
        seo_keywords=post.seo_keywords,
        canonical_url=post.canonical_url,
        og_title=post.og_title,
        og_description=post.og_description,
        og_image_url=post.og_image_url,
        meta_robots=post.meta_robots,
        disclaimer=post.disclaimer,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


# ---- Categories ----
@router.get("/categories", response_model=ApiResponse[list[CategoryOut]])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("post.read")),
):
    cats = await BlogService(db).list_categories()
    return ApiResponse(data=[CategoryOut.model_validate(c) for c in cats])


@router.post("/categories", response_model=ApiResponse[CategoryOut])
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("post.write")),
):
    cat = await BlogService(db).create_category(payload)
    return ApiResponse(data=CategoryOut.model_validate(cat))


# ---- Posts ----
@router.get("/posts", response_model=ApiResponse[list[PostListItem]])
async def list_posts(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("post.read")),
):
    rows, total = await BlogService(db).list_admin(status, page, page_size)
    return ApiResponse(
        data=[PostListItem.model_validate(p) for p in rows],
        meta={"total": total, "page": page, "page_size": page_size},
    )


@router.post("/posts", response_model=ApiResponse[PostAdminDetail])
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(require_permission("post.write")),
):
    post = await BlogService(db).create_post(payload, user)
    return ApiResponse(data=_to_admin_detail(post))


@router.get("/posts/{post_id}", response_model=ApiResponse[PostAdminDetail])
async def get_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("post.read")),
):
    from app.core.exceptions import NotFoundError

    post = await BlogService(db).repo.get_post(post_id)
    if post is None or post.deleted_at is not None:
        raise NotFoundError("post_not_found", "Bài viết không tồn tại")
    return ApiResponse(data=_to_admin_detail(post))


@router.put("/posts/{post_id}", response_model=ApiResponse[PostAdminDetail])
async def update_post(
    post_id: UUID,
    payload: PostUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("post.write")),
):
    post = await BlogService(db).update_post(post_id, payload)
    return ApiResponse(data=_to_admin_detail(post))


@router.patch("/posts/{post_id}/status", response_model=ApiResponse[PostAdminDetail])
async def change_status(
    post_id: UUID,
    payload: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    # publish cần quyền cao hơn — kiểm tra trong handler
    user=Depends(get_current_user),
):
    # approve/publish yêu cầu post.publish; còn lại chỉ cần post.write
    needed = "post.publish" if payload.action in {"approve", "publish"} else "post.write"
    if not user.has_permission(needed):
        from app.core.exceptions import ForbiddenError

        raise ForbiddenError("forbidden", f"Không đủ quyền: {needed}")
    post = await BlogService(db).change_status(post_id, payload.action)
    return ApiResponse(data=_to_admin_detail(post))


@router.delete("/posts/{post_id}", response_model=ApiResponse[dict])
async def delete_post(
    post_id: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("post.write")),
):
    await BlogService(db).soft_delete(post_id)
    return ApiResponse(data={"deleted": True})
