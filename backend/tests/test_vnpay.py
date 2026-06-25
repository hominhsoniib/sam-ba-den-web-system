import urllib.parse
from app.services.vnpay_service import VNPayService
from app.core.config import settings

def test_vnpay_url_generation_and_verification():
    # 1. Thử sinh link thanh toán
    amount = 5000000.0
    txn_ref = "TXN_TEST_12345"
    ip_address = "192.168.1.1"
    order_info = "Thanh toan cong no dai ly test"
    
    payment_url = VNPayService.generate_payment_url(
        amount=amount,
        txn_ref=txn_ref,
        ip_address=ip_address,
        order_info=order_info
    )
    
    assert payment_url.startswith(settings.vnpay_url)
    
    # Parse URL để lấy các tham số query
    parsed_url = urllib.parse.urlparse(payment_url)
    query_params = urllib.parse.parse_qs(parsed_url.query)
    
    # Chuyển đổi từ dict[str, list[str]] -> dict[str, str]
    params = {k: v[0] for k, v in query_params.items()}
    
    # Kiểm tra các tham số
    assert params["vnp_Version"] == "2.1.0"
    assert params["vnp_Command"] == "pay"
    assert params["vnp_TmnCode"] == settings.vnpay_tmn_code
    assert params["vnp_Amount"] == "500000000"  # 5,000,000 * 100
    assert params["vnp_TxnRef"] == txn_ref
    assert params["vnp_IpAddr"] == ip_address
    assert params["vnp_OrderInfo"] == order_info
    assert "vnp_SecureHash" in params
    
    # 2. Kiểm tra xác minh chữ ký (verify_callback)
    is_valid = VNPayService.verify_callback(params)
    assert is_valid is True
    
    # Nếu sửa đổi tham số, chữ ký sẽ không khớp
    invalid_params = params.copy()
    invalid_params["vnp_Amount"] = "600000000"
    is_valid_modified = VNPayService.verify_callback(invalid_params)
    assert is_valid_modified is False
