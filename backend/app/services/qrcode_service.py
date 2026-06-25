"""Logic nghiệp vụ QR Code & Truy xuất nguồn gốc (M8)."""
import random
import string
from uuid import UUID, uuid4
from datetime import datetime

from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.models.qrcode import ProductBatch, QRCode, QRScanLog
from app.models.product import Product
from app.schemas.qrcode import ProductBatchCreate, ProductBatchUpdate, QRVerifyResponse, ProductBatchOut


def generate_batch_no() -> str:
    """Tạo mã lô hàng ngẫu nhiên không trùng lặp."""
    date_str = datetime.now().strftime("%Y%m%d")
    rand_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"BAT-{date_str}-{rand_str}"


class QRService:
    def __init__(self, db: AsyncSession, user_id: UUID | None = None):
        self.db = db
        self.user_id = user_id

    async def create_batch(self, payload: ProductBatchCreate) -> ProductBatch:
        # Kiểm tra sản phẩm có tồn tại không
        product = await self.db.get(Product, payload.product_id)
        if not product:
            raise NotFoundError("product_not_found", f"Sản phẩm {payload.product_id} không tồn tại")

        # Tạo batch_no nếu chưa có
        batch_no = payload.batch_no or generate_batch_no()
        
        # Kiểm tra trùng batch_no
        existing = (
            await self.db.execute(select(ProductBatch).where(ProductBatch.batch_no == batch_no))
        ).scalar_one_or_none()
        if existing:
            if payload.batch_no:
                raise ValidationError("batch_no_exists", f"Mã lô hàng {batch_no} đã tồn tại")
            batch_no = generate_batch_no()  # Thử lại mã khác nếu tự sinh trùng

        if not self.user_id:
            raise ValidationError("user_required", "Yêu cầu user_id để tạo lô hàng")

        batch = ProductBatch(
            batch_no=batch_no,
            product_id=payload.product_id,
            manufacture_date=payload.manufacture_date,
            expiry_date=payload.expiry_date,
            quantity=payload.quantity,
            warehouse=payload.warehouse,
            supplier_name=payload.supplier_name,
            origin_region=payload.origin_region,
            notes=payload.notes,
            status="active",
            qr_count=payload.quantity,
            created_by=self.user_id
        )
        self.db.add(batch)
        await self.db.flush()  # Để lấy batch.id

        # Sinh mã QR tương ứng
        for i in range(payload.quantity):
            label = f"Hộp #{i + 1:03d}"
            qr = QRCode(
                batch_id=batch.id,
                token=str(uuid4()),
                label=label,
                status="active",
                scan_count=0,
                single_use=False
            )
            self.db.add(qr)

        await self.db.commit()
        
        # Load lại để trả về thông tin đầy đủ
        stmt = (
            select(ProductBatch)
            .where(ProductBatch.id == batch.id)
            .options(selectinload(ProductBatch.product))
        )
        res = await self.db.execute(stmt)
        return res.scalar_one()

    async def list_batches(
        self,
        product_id: UUID | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[list[ProductBatch], int]:
        stmt = select(ProductBatch).options(selectinload(ProductBatch.product))
        count_stmt = select(func.count()).select_from(ProductBatch)

        if product_id:
            stmt = stmt.where(ProductBatch.product_id == product_id)
            count_stmt = count_stmt.where(ProductBatch.product_id == product_id)

        if status:
            stmt = stmt.where(ProductBatch.status == status)
            count_stmt = count_stmt.where(ProductBatch.status == status)

        stmt = stmt.order_by(desc(ProductBatch.created_at))
        
        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        batches = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar() or 0

        return list(batches), total

    async def get_batch(self, batch_id: UUID) -> ProductBatch:
        stmt = (
            select(ProductBatch)
            .where(ProductBatch.id == batch_id)
            .options(selectinload(ProductBatch.product))
        )
        batch = (await self.db.execute(stmt)).scalar_one_or_none()
        if not batch:
            raise NotFoundError("batch_not_found", f"Lô hàng {batch_id} không tồn tại")
        return batch

    async def update_batch(self, batch_id: UUID, payload: ProductBatchUpdate) -> ProductBatch:
        batch = await self.get_batch(batch_id)
        
        if payload.manufacture_date is not None:
            batch.manufacture_date = payload.manufacture_date
        if payload.expiry_date is not None:
            batch.expiry_date = payload.expiry_date
        if payload.warehouse is not None:
            batch.warehouse = payload.warehouse
        if payload.supplier_name is not None:
            batch.supplier_name = payload.supplier_name
        if payload.origin_region is not None:
            batch.origin_region = payload.origin_region
        if payload.notes is not None:
            batch.notes = payload.notes
        if payload.status is not None:
            batch.status = payload.status

        await self.db.commit()
        return batch

    async def list_qrcodes(
        self,
        batch_id: UUID,
        page: int = 1,
        page_size: int = 50
    ) -> tuple[list[QRCode], int]:
        stmt = select(QRCode).where(QRCode.batch_id == batch_id).order_by(QRCode.label)
        count_stmt = select(func.count()).select_from(QRCode).where(QRCode.batch_id == batch_id)

        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        qrcodes = (await self.db.execute(stmt)).scalars().all()
        total = (await self.db.execute(count_stmt)).scalar() or 0

        return list(qrcodes), total

    async def revoke_batch(self, batch_id: UUID) -> ProductBatch:
        batch = await self.get_batch(batch_id)
        batch.status = "archived"
        
        # Thu hồi tất cả QR trong lô
        await self.db.execute(
            select(QRCode).where(QRCode.batch_id == batch_id)
        ) # Ensure we flag/update
        from sqlalchemy import update
        await self.db.execute(
            update(QRCode).where(QRCode.batch_id == batch_id).values(status="revoked")
        )
        
        await self.db.commit()
        return batch

    async def revoke_qrcode(self, qr_id: UUID) -> QRCode:
        qr = await self.db.get(QRCode, qr_id)
        if not qr:
            raise NotFoundError("qrcode_not_found", "Mã QR không tồn tại")
        
        qr.status = "revoked"
        await self.db.commit()
        return qr

    async def verify_qrcode(
        self,
        token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        referer: str | None = None
    ) -> QRVerifyResponse:
        # Tìm QRCode theo token, load kèm batch và product
        stmt = (
            select(QRCode)
            .where(QRCode.token == token)
            .options(
                selectinload(QRCode.batch).selectinload(ProductBatch.product)
            )
        )
        qr = (await self.db.execute(stmt)).scalar_one_or_none()
        if not qr:
            return QRVerifyResponse(
                authentic=False,
                status="not_found",
                scan_count=0,
                first_scan_at=None,
                batch=None,
                message="Mã QR không hợp lệ hoặc không tồn tại trên hệ thống của chúng tôi!"
            )

        # Lấy lịch sử quét để biết lần quét đầu tiên
        history_stmt = (
            select(QRScanLog)
            .where(QRScanLog.qr_code_id == qr.id)
            .order_by(QRScanLog.created_at.asc())
        )
        logs = (await self.db.execute(history_stmt)).scalars().all()
        first_scan_at = logs[0].created_at if logs else None

        # Trạng thái hiện tại
        authentic = True
        status = qr.status
        message = "Sản phẩm chính hãng từ Sâm Bà Đen."
        warning = None

        if status == "revoked":
            authentic = False
            message = "Cảnh báo: Mã QR này đã bị HỦY/THU HỒI trên hệ thống!"
            result_log = "revoked"
        elif qr.single_use and qr.scan_count > 0:
            authentic = False
            message = "Cảnh báo: Sản phẩm này đã được xác thực trước đó. Có khả năng đây là hàng giả sao chép mã!"
            warning = f"Mã này đã được xác thực lần đầu vào {first_scan_at.strftime('%Y-%m-%d %H:%M:%S') if first_scan_at else 'chưa rõ'}"
            result_log = "already_used"
        elif qr.scan_count > 0:
            # Vẫn chính hãng nhưng quét nhiều lần
            warning = f"Cảnh báo: Mã QR này đã được quét {qr.scan_count} lần trước đó. Hãy cẩn thận kiểm tra vỏ hộp!"
            result_log = "authentic"
        else:
            message = "Xác thực thành công! Đây là lần đầu tiên sản phẩm này được quét."
            result_log = "authentic"

        # Tăng scan_count của QRCode
        qr.scan_count += 1
        
        # Ghi log lượt quét mới
        new_log = QRScanLog(
            qr_code_id=qr.id,
            ip_address=ip_address,
            user_agent=user_agent,
            referer=referer,
            result=result_log
        )
        self.db.add(new_log)
        
        await self.db.commit()

        # Build batch out DTO
        batch_dto = None
        if qr.batch:
            batch_dto = ProductBatchOut(
                id=qr.batch.id,
                batch_no=qr.batch.batch_no,
                product_id=qr.batch.product_id,
                product_name=qr.batch.product.name if qr.batch.product else None,
                sku=qr.batch.product.sku if qr.batch.product else None,
                manufacture_date=qr.batch.manufacture_date,
                expiry_date=qr.batch.expiry_date,
                quantity=qr.batch.quantity,
                warehouse=qr.batch.warehouse,
                supplier_name=qr.batch.supplier_name,
                origin_region=qr.batch.origin_region,
                notes=qr.batch.notes,
                status=qr.batch.status,
                qr_count=qr.batch.qr_count,
                created_by=qr.batch.created_by,
                created_at=qr.batch.created_at,
                updated_at=qr.batch.updated_at
            )

        return QRVerifyResponse(
            authentic=authentic,
            status=status,
            scan_count=qr.scan_count, # Số lần trước khi cộng hoặc tổng số lần
            first_scan_at=first_scan_at or datetime.now(),
            batch=batch_dto,
            message=message,
            warning=warning
        )
