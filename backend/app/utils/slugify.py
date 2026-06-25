"""Chuyển tiêu đề tiếng Việt thành slug ASCII chuẩn SEO."""
import re
import unicodedata

# Map ký tự đặc biệt tiếng Việt mà NFKD không tách hết
_SPECIAL = {"đ": "d", "Đ": "d"}


def slugify(text: str) -> str:
    """'Sâm Bà Đen — Báu vật!' -> 'sam-ba-den-bau-vat'."""
    text = text.strip().lower()
    for k, v in _SPECIAL.items():
        text = text.replace(k.lower(), v)
    # Tách dấu: NFKD rồi bỏ ký tự kết hợp (combining marks)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    # Giữ chữ-số, thay phần còn lại bằng gạch ngang
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")
