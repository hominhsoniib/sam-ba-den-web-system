"""Router công khai Sản phẩm (M6): list, chi tiết (SEO + JSON-LD Product)."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.product import ProductListItem, ProductPublicDetail
from app.services.product_service import ProductService, to_list_item

router = APIRouter(tags=["public:products"])


@router.get("/public/products", response_model=ApiResponse[list[ProductListItem]])
async def list_products(
    category: str | None = Query(None, alias="danh-muc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    rows, total = await ProductService(db).list_public(category, page, page_size)
    return ApiResponse(
        data=[ProductListItem(**to_list_item(p)) for p in rows],
        meta={"total": total, "page": page, "page_size": page_size},
    )


@router.get(
    "/public/products/{slug}", response_model=ApiResponse[ProductPublicDetail]
)
async def get_product(slug: str, db: AsyncSession = Depends(get_db)):
    detail = await ProductService(db).get_public_detail(slug)
    return ApiResponse(data=detail)


@router.get(
    "/public/product-categories",
    response_model=ApiResponse[list],
)
async def list_categories(db: AsyncSession = Depends(get_db)):
    from app.schemas.product import ProductCategoryOut

    cats = await ProductService(db).list_categories()
    return ApiResponse(data=[ProductCategoryOut.model_validate(c) for c in cats])
