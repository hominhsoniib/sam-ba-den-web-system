from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.payment import PaymentTransaction
from app.schemas.common import ApiResponse
from app.schemas.portal import (
    PortalDealerProfile, PortalProduct, PortalOrderCreate,
    PortalPaymentCreate, PortalPaymentUrlOut, PortalPaymentVerifyOut
)
from app.schemas.order import OrderDetail
from app.schemas.dealer import DealerLedgerOut
from app.services.portal_service import PortalService
from app.services.export_service import ExportService
from app.services.vnpay_service import VNPayService

router = APIRouter(tags=["portal:dealer"])


@router.get("/me", response_model=ApiResponse[PortalDealerProfile])
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await PortalService(db, current_user.id).get_profile()
    return ApiResponse(data=PortalDealerProfile.model_validate(profile))


@router.get("/products", response_model=ApiResponse[list[PortalProduct]])
async def list_portal_products(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    products = await PortalService(db, current_user.id).list_products()
    return ApiResponse(data=products)


@router.post("/orders", response_model=ApiResponse[OrderDetail])
async def create_portal_order(
    payload: PortalOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    order = await PortalService(db, current_user.id).create_order(payload)
    return ApiResponse(data=OrderDetail.model_validate(order))


@router.get("/orders", response_model=ApiResponse[list[OrderDetail]])
async def list_portal_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    orders = await PortalService(db, current_user.id).list_orders()
    return ApiResponse(data=[OrderDetail.model_validate(o) for o in orders])


@router.get("/orders/export")
async def export_portal_orders(
    format: str = Query("excel", regex="^(excel|pdf)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    orders = await PortalService(db, current_user.id).list_orders()
    order_details = [OrderDetail.model_validate(o) for o in orders]
    
    if format == "excel":
        file_stream = ExportService.export_orders_to_excel(order_details)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "Don_hang_SBD.xlsx"
    else:
        file_stream = ExportService.export_orders_to_pdf(order_details)
        media_type = "application/pdf"
        filename = "Don_hang_SBD.pdf"
        
    return StreamingResponse(
        file_stream, 
        media_type=media_type, 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/ledger", response_model=ApiResponse[list[DealerLedgerOut]])
async def list_portal_ledger(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ledgers = await PortalService(db, current_user.id).list_ledger()
    return ApiResponse(data=[DealerLedgerOut.model_validate(l) for l in ledgers])


@router.get("/ledger/export")
async def export_portal_ledger(
    format: str = Query("excel", regex="^(excel|pdf)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ledgers = await PortalService(db, current_user.id).list_ledger()
    ledger_details = [DealerLedgerOut.model_validate(l) for l in ledgers]
    
    if format == "excel":
        file_stream = ExportService.export_ledger_to_excel(ledger_details)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = "So_cai_SBD.xlsx"
    else:
        file_stream = ExportService.export_ledger_to_pdf(ledger_details)
        media_type = "application/pdf"
        filename = "So_cai_SBD.pdf"
        
    return StreamingResponse(
        file_stream, 
        media_type=media_type, 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/payments/vnpay_url", response_model=ApiResponse[PortalPaymentUrlOut])
async def create_vnpay_payment_url(
    payload: PortalPaymentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    portal_service = PortalService(db, current_user.id)
    dealer = await portal_service.get_current_dealer()
    
    # Generate unique txn_ref
    import uuid
    now_str = VNPayService.get_vietnam_now().strftime("%Y%m%d%H%M%S")
    txn_ref = f"SBD{now_str}{uuid.uuid4().hex[:6].upper()}"
    
    # Create PaymentTransaction in pending state
    txn = PaymentTransaction(
        id=uuid.uuid4(),
        dealer_id=dealer.id,
        amount=payload.amount,
        payment_method="vnpay",
        txn_ref=txn_ref,
        status="pending"
    )
    db.add(txn)
    await db.commit()
    
    # Generate VNPay payment URL
    client_ip = request.client.host if request.client else "127.0.0.1"
    order_info = f"Thanh toan cong no dai ly {dealer.code} (so tien {payload.amount:,.0f} VND)"
    
    payment_url = VNPayService.generate_payment_url(
        amount=payload.amount,
        txn_ref=txn_ref,
        ip_address=client_ip,
        order_info=order_info
    )
    
    return ApiResponse(data=PortalPaymentUrlOut(payment_url=payment_url))


@router.get("/payments/vnpay_return", response_model=ApiResponse[PortalPaymentVerifyOut])
async def vnpay_payment_return(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    params = dict(request.query_params)
    
    if not VNPayService.verify_callback(params):
        return ApiResponse(
            success=False,
            error={"code": "invalid_signature", "message": "Chữ ký giao dịch VNPay không hợp lệ."},
            data=PortalPaymentVerifyOut(
                status="failed",
                amount=0.0,
                txn_ref="",
                message="Chữ ký không hợp lệ"
            )
        )
        
    vnp_ResponseCode = params.get("vnp_ResponseCode")
    txn_ref = params.get("vnp_TxnRef")
    amount_raw = params.get("vnp_Amount")
    vnpay_tran_no = params.get("vnp_TransactionNo")
    
    amount = float(amount_raw) / 100.0 if amount_raw else 0.0
    
    stmt = select(PaymentTransaction).where(PaymentTransaction.txn_ref == txn_ref)
    txn = (await db.execute(stmt)).scalar_one_or_none()
    
    if not txn:
        return ApiResponse(
            success=False,
            error={"code": "transaction_not_found", "message": f"Không tìm thấy giao dịch {txn_ref}."},
            data=PortalPaymentVerifyOut(
                status="failed",
                amount=amount,
                txn_ref=txn_ref or "",
                message="Giao dịch không tồn tại"
            )
        )
        
    if txn.status == "pending":
        txn.vnpay_tran_no = vnpay_tran_no
        txn.raw_response = str(params)
        
        if vnp_ResponseCode == "00":
            txn.status = "success"
            
            if txn.dealer_id:
                from app.models.dealer import Dealer
                dealer = await db.get(Dealer, txn.dealer_id)
                actor_id = dealer.user_id if dealer else txn.dealer_id
                
                from app.schemas.dealer import DealerLedgerCreate
                from app.services.dealer_service import DealerService
                
                ledger_payload = DealerLedgerCreate(
                    entry_type="credit",
                    amount=txn.amount,
                    ref_type="payment",
                    ref_id=txn.id,
                    note=f"Thanh toan cong no qua VNPay (Ma GD: {vnpay_tran_no})"
                )
                await DealerService(db).record_ledger_entry(
                    dealer_id=txn.dealer_id,
                    data=ledger_payload,
                    creator_id=actor_id
                )
        else:
            txn.status = "failed"
            
        await db.commit()
        await db.refresh(txn)
        
    msg = "Thanh toán thành công" if txn.status == "success" else "Thanh toán thất bại"
    return ApiResponse(
        data=PortalPaymentVerifyOut(
            status=txn.status,
            amount=float(txn.amount),
            txn_ref=txn.txn_ref,
            message=msg
        )
    )


@router.get("/payments/vnpay_ipn")
async def vnpay_payment_ipn(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    params = dict(request.query_params)
    
    if not VNPayService.verify_callback(params):
        return {"RspCode": "97", "Message": "Invalid signature"}
        
    vnp_ResponseCode = params.get("vnp_ResponseCode")
    txn_ref = params.get("vnp_TxnRef")
    amount_raw = params.get("vnp_Amount")
    vnpay_tran_no = params.get("vnp_TransactionNo")
    amount = float(amount_raw) / 100.0 if amount_raw else 0.0
    
    stmt = select(PaymentTransaction).where(PaymentTransaction.txn_ref == txn_ref)
    txn = (await db.execute(stmt)).scalar_one_or_none()
    
    if not txn:
        return {"RspCode": "01", "Message": "Order not found"}
        
    if abs(float(txn.amount) - amount) > 0.01:
        return {"RspCode": "04", "Message": "Invalid amount"}
        
    if txn.status != "pending":
        return {"RspCode": "02", "Message": "Order already confirmed"}
        
    txn.vnpay_tran_no = vnpay_tran_no
    txn.raw_response = str(params)
    
    if vnp_ResponseCode == "00":
        txn.status = "success"
        
        if txn.dealer_id:
            from app.models.dealer import Dealer
            dealer = await db.get(Dealer, txn.dealer_id)
            actor_id = dealer.user_id if dealer else txn.dealer_id
            
            from app.schemas.dealer import DealerLedgerCreate
            from app.services.dealer_service import DealerService
            
            ledger_payload = DealerLedgerCreate(
                entry_type="credit",
                amount=txn.amount,
                ref_type="payment",
                ref_id=txn.id,
                note=f"Thanh toan cong no qua VNPay (IPN - Ma GD: {vnpay_tran_no})"
            )
            await DealerService(db).record_ledger_entry(
                dealer_id=txn.dealer_id,
                data=ledger_payload,
                creator_id=actor_id
            )
    else:
        txn.status = "failed"
        
    await db.commit()
    return {"RspCode": "00", "Message": "Confirm success"}
