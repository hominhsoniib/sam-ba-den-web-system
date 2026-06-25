"""Router công khai quét mã QR & Xác thực hàng thật (M8)."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.common import ApiResponse
from app.schemas.qrcode import QRVerifyResponse
from app.services.qrcode_service import QRService

router = APIRouter(prefix="/public/qrcode", tags=["public:qrcode"])


@router.get("/verify/{token}", response_model=ApiResponse[QRVerifyResponse])
async def verify_qrcode(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Lấy thông tin client scan để ghi log chống hàng giả
    client_ip = request.client.host if request.client else None
    
    # X-Forwarded-For nếu ở sau proxy/load balancer
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()

    user_agent = request.headers.get("user-agent")
    referer = request.headers.get("referer")

    svc = QRService(db)
    result = await svc.verify_qrcode(
        token=token,
        ip_address=client_ip,
        user_agent=user_agent,
        referer=referer
    )
    return ApiResponse(data=result)
