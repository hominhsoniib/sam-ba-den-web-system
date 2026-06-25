"""Router quản trị Sản phẩm (M6) - Đầy đủ: CRUD, bảng giá đa kênh, tồn kho."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.core.security import require_permission
from app.schemas.common import ApiResponse
from app.schemas.product import (
    InventoryAdjustIn,
    ProductAdminDetail,
    ProductCategoryCreate,
    ProductCategoryOut,
    ProductCreate,
    ProductInventoryOut,
    ProductListItem,
    ProductPriceIn,
    ProductPriceOut,
    ProductUpdate,
)
from app.services.product_service import ProductService, to_list_item

router = APIRouter(prefix="/admin/products", tags=["admin:products"])


def _to_admin_detail(p) -> ProductAdminDetail:
    base = to_list_item(p)
    return ProductAdminDetail(
        **base,
        description=p.description,
        packaging_info=getattr(p, "packaging_info", None),
        weight_g=getattr(p, "weight_g", None),
        usage_info=p.usage_info,
        disclaimer=p.disclaimer,
        seo_title=p.seo_title,
        seo_description=p.seo_description,
        og_image_url=p.og_image_url,
        sort_order=p.sort_order,
        images=p.images,
        prices=p.prices,
        inventory=p.inventory,
    )


# ============================================================
# Categories
# ============================================================
@router.get("/categories", response_model=ApiResponse[list[ProductCategoryOut]])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.read")),
):
    cats = await ProductService(db).list_categories()
    return ApiResponse(data=[ProductCategoryOut.model_validate(c) for c in cats])


@router.post("/categories", response_model=ApiResponse[ProductCategoryOut])
async def create_category(
    payload: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    cat = await ProductService(db).create_category(payload)
    return ApiResponse(data=ProductCategoryOut.model_validate(cat))


# ============================================================
# Products – CRUD
# ============================================================
@router.get("", response_model=ApiResponse[list[ProductListItem]])
async def list_products(
    status: str | None = Query(None),
    category_id: UUID | None = Query(None),
    q: str | None = Query(None, description="Tìm theo tên/SKU/barcode"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.read")),
):
    rows, total = await ProductService(db).list_admin(status, page, page_size)
    return ApiResponse(
        data=[ProductListItem(**to_list_item(p)) for p in rows],
        meta={"total": total, "page": page, "page_size": page_size},
    )


@router.get("/{pid}", response_model=ApiResponse[ProductAdminDetail])
async def get_product(
    pid: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.read")),
):
    p = await ProductService(db).repo.get_product(pid)
    if p is None:
        raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")
    return ApiResponse(data=_to_admin_detail(p))


@router.post("", response_model=ApiResponse[ProductAdminDetail])
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    p = await ProductService(db).create_product(payload)
    return ApiResponse(data=_to_admin_detail(p))


@router.put("/{pid}", response_model=ApiResponse[ProductAdminDetail])
async def update_product(
    pid: UUID,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    p = await ProductService(db).update_product(pid, payload)
    return ApiResponse(data=_to_admin_detail(p))


@router.delete("/{pid}", response_model=ApiResponse[dict])
async def delete_product(
    pid: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    await ProductService(db).delete_product(pid)
    return ApiResponse(data={"deleted": True})


# ============================================================
# Prices – quản lý bảng giá đa kênh
# ============================================================
@router.get("/{pid}/prices", response_model=ApiResponse[list[ProductPriceOut]])
async def get_prices(
    pid: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.read")),
):
    """Lấy tất cả bảng giá của sản phẩm."""
    svc = ProductService(db)
    p = await svc.repo.get_product(pid)
    if p is None:
        raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")
    return ApiResponse(data=[ProductPriceOut.model_validate(pr) for pr in p.prices])


@router.put("/{pid}/prices", response_model=ApiResponse[ProductAdminDetail])
async def set_prices(
    pid: UUID,
    prices: list[ProductPriceIn],
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    """Thay thế toàn bộ bảng giá của sản phẩm."""
    p = await ProductService(db).update_product(pid, payload=type(
        "ProductUpdate", (), {"model_dump": lambda self, **kw: {"prices": [pr.model_dump() for pr in prices]}}
    )())
    return ApiResponse(data=_to_admin_detail(p))


@router.post("/{pid}/prices", response_model=ApiResponse[ProductAdminDetail])
async def upsert_prices(
    pid: UUID,
    prices: list[ProductPriceIn],
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    """Cập nhật/thêm bảng giá (upsert theo channel)."""
    from app.models.product import ProductPrice as PriceModel
    svc = ProductService(db)
    p = await svc.repo.get_product(pid)
    if p is None:
        raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")

    existing_map = {pr.channel: pr for pr in p.prices}
    for price_in in prices:
        if price_in.channel in existing_map:
            row = existing_map[price_in.channel]
            row.price = price_in.price
            row.is_active = price_in.is_active
            row.note = price_in.note
        else:
            new_price = PriceModel(
                product_id=pid,
                channel=price_in.channel,
                price=price_in.price,
                is_active=price_in.is_active,
                note=price_in.note,
            )
            db.add(new_price)
    await db.commit()
    p = await svc.repo.get_product(pid)
    return ApiResponse(data=_to_admin_detail(p))


# ============================================================
# Inventory – quản lý tồn kho
# ============================================================
@router.get("/{pid}/inventory", response_model=ApiResponse[list[ProductInventoryOut]])
async def get_inventory(
    pid: UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.read")),
):
    """Lấy tồn kho theo tất cả kho."""
    svc = ProductService(db)
    p = await svc.repo.get_product(pid)
    if p is None:
        raise NotFoundError("product_not_found", "Sản phẩm không tồn tại")
    return ApiResponse(
        data=[
            ProductInventoryOut(
                id=inv.id,
                warehouse=inv.warehouse,
                qty_on_hand=inv.qty_on_hand,
                qty_reserved=inv.qty_reserved,
                qty_available=inv.qty_available,
                low_stock_threshold=inv.low_stock_threshold,
            )
            for inv in p.inventory
        ]
    )


@router.post("/{pid}/inventory/adjust", response_model=ApiResponse[ProductAdminDetail])
async def adjust_inventory(
    pid: UUID,
    payload: InventoryAdjustIn,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permission("product.write")),
):
    """Điều chỉnh tồn kho: nhập hàng (delta > 0), xuất kho (delta < 0)."""
    p = await ProductService(db).adjust_inventory(pid, payload)
    return ApiResponse(data=_to_admin_detail(p))
