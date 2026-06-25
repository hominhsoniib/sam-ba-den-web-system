"""Dịch vụ xử lý thanh toán VNPay (Tạo URL, xác minh chữ ký)."""
import hashlib
import hmac
import urllib.parse
from datetime import datetime, timezone, timedelta
from app.core.config import settings

class VNPayService:
    @staticmethod
    def get_vietnam_now() -> datetime:
        """Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)."""
        tz_vn = timezone(timedelta(hours=7))
        return datetime.now(tz_vn)

    @classmethod
    def generate_payment_url(
        cls,
        amount: float,
        txn_ref: str,
        ip_address: str,
        order_info: str,
        locale: str = "vn"
    ) -> str:
        """
        Tạo URL thanh toán VNPay Sandbox.
        - amount: Số tiền thanh toán (VND)
        - txn_ref: Mã tham chiếu duy nhất của giao dịch
        - ip_address: IP của người dùng thực hiện giao dịch
        - order_info: Nội dung mô tả thanh toán
        """
        now = cls.get_vietnam_now()
        vnp_create_date = now.strftime("%Y%m%d%H%M%S")

        # Chuẩn bị tham số VNPay 2.1.0
        vnp_params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": settings.vnpay_tmn_code,
            "vnp_Amount": str(int(amount * 100)),  # Nhân 100 theo yêu cầu VNPay
            "vnp_CreateDate": vnp_create_date,
            "vnp_CurrCode": "VND",
            "vnp_IpAddr": ip_address or "127.0.0.1",
            "vnp_Locale": locale,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "billpayment",
            "vnp_ReturnUrl": settings.vnpay_return_url,
            "vnp_TxnRef": txn_ref,
        }

        # Sắp xếp các tham số theo thứ tự alphabet
        sorted_params = sorted(vnp_params.items())

        # Tạo chuỗi query để ký
        query_parts = []
        for k, v in sorted_params:
            if v is not None and v != "":
                query_parts.append(
                    f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe='')}"
                )
        
        sign_data = "&".join(query_parts)

        # Tính toán chữ ký HMAC-SHA512
        secure_hash = hmac.new(
            settings.vnpay_hash_secret.encode("utf-8"),
            sign_data.encode("utf-8"),
            hashlib.sha512
        ).hexdigest()

        # Tạo URL thanh toán hoàn chỉnh
        payment_url = f"{settings.vnpay_url}?{sign_data}&vnp_SecureHash={secure_hash}"
        return payment_url

    @classmethod
    def verify_callback(cls, params: dict) -> bool:
        """
        Xác minh chữ ký phản hồi trả về từ VNPay.
        - params: dict chứa các query parameter nhận được từ callback
        """
        secure_hash = params.get("vnp_SecureHash")
        if not secure_hash:
            return False

        # Loại bỏ các tham số bảo mật khỏi dữ liệu ký
        signature_params = {
            k: v for k, v in params.items() 
            if k not in ("vnp_SecureHash", "vnp_SecureHashType")
        }

        # Sắp xếp và tạo chuỗi query
        sorted_params = sorted(signature_params.items())
        query_parts = []
        for k, v in sorted_params:
            if v is not None and v != "":
                query_parts.append(
                    f"{urllib.parse.quote(str(k), safe='')}={urllib.parse.quote(str(v), safe='')}"
                )

        sign_data = "&".join(query_parts)

        # Tính toán chữ ký mong đợi
        expected_hash = hmac.new(
            settings.vnpay_hash_secret.encode("utf-8"),
            sign_data.encode("utf-8"),
            hashlib.sha512
        ).hexdigest()

        # So sánh chữ ký an toàn (tránh timing attack)
        return hmac.compare_digest(expected_hash.lower(), secure_hash.lower())
