"""Router công khai Blog (M3): list, chi tiết (SEO + JSON-LD), sitemap, robots."""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.blog import PostListItem, PostPublicDetail, CategoryOut
from app.schemas.common import ApiResponse
from app.services.blog_service import BlogService

router = APIRouter(tags=["public:blog"])
root_router = APIRouter(tags=["seo"])


@router.get(
    "/public/post-categories",
    response_model=ApiResponse[list[CategoryOut]],
)
async def list_categories(db: AsyncSession = Depends(get_db)):
    cats = await BlogService(db).list_categories()
    return ApiResponse(data=[CategoryOut.model_validate(c) for c in cats])



@router.get("/public/posts", response_model=ApiResponse[list[PostListItem]])
async def list_posts(
    category: str | None = Query(None, alias="danh-muc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    rows, total = await BlogService(db).list_public(category, page, page_size)
    return ApiResponse(
        data=[PostListItem.model_validate(p) for p in rows],
        meta={"total": total, "page": page, "page_size": page_size},
    )


@router.get("/public/posts/{slug}", response_model=ApiResponse[PostPublicDetail])
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    detail = await BlogService(db).get_public_detail(slug)
    return ApiResponse(data=detail)


@root_router.get("/sitemap.xml")
async def sitemap(db: AsyncSession = Depends(get_db)):
    from app.repositories.blog_repository import BlogRepository
    from app.repositories.product_repository import ProductRepository

    site = settings.site_url
    post_slugs = await BlogRepository(db).all_published_slugs()
    product_slugs = await ProductRepository(db).all_active_slugs()
    urls = [f"{site}/", f"{site}/blog", f"{site}/san-pham"]
    urls += [f"{site}/blog/{slug}" for slug, _cat in post_slugs]
    urls += [f"{site}/san-pham/{slug}" for slug in product_slugs]
    body = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls)
        + "</urlset>\n"
    )
    return Response(content=body, media_type="application/xml")


@root_router.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    site = settings.site_url
    return f"User-agent: *\nAllow: /\nSitemap: {site}/sitemap.xml\n"
