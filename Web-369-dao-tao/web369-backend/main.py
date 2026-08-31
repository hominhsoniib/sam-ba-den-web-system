import json
from datetime import timedelta
from fastapi import FastAPI, Depends, Cookie, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.database import get_db, engine, Base
from app.core.security import create_access_token, decode_access_token
from app.core.config import settings
from app.services.auth import AuthService
from app.models.models import Course

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",  # phản chiếu đúng Origin gọi tới — bắt buộc khi dùng cookie (credentials) xuyên domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

COOKIE_NAME = "w369_token"


def _seed_courses_if_empty(db: Session):
    if db.query(Course).count() > 0:
        return
    seed = [
        dict(id="c1", category_icon="🚀", title="Khởi nghiệp & Kế toán Hộ KD",
             description="Tư duy kinh doanh thực chiến, thủ tục đăng ký hộ kinh doanh, kê khai thuế và lập sổ sách ban đầu.",
             min_role="Thành viên", lesson_count=12, sort_order=1),
        dict(id="c2", category_icon="🤝", title="Hiểu rõ về Điều lệ & Quyền lợi HTX 369",
             description="Quy chế hoạt động, vốn góp thành viên, phân phối cổ tức và cơ chế giao dịch chung trong hợp tác xã.",
             min_role="Thành viên", lesson_count=6, sort_order=2),
        dict(id="c3", category_icon="📣", title="Marketing & Bán hàng Thực chiến",
             description="Xây dựng kênh bán hàng online, content thu hút khách hàng local và quy trình chăm sóc khách hàng tự động.",
             min_role="Thành viên", lesson_count=10, sort_order=3),
        dict(id="c4", category_icon="📊", title="Quản lý Nhóm & Giao KPI Điểm Bán",
             description="Kỹ năng điều hành tổ sản xuất, theo dõi tiến độ KPI các hộ kinh doanh thành viên trong cụm.",
             min_role="Tổ trưởng", lesson_count=8, sort_order=4),
        dict(id="c5", category_icon="🏛️", title="Quản trị Tài chính & Dòng tiền HTX",
             description="Báo cáo tài chính hợp nhất, thẩm định dự án đầu tư và điều phối dòng tiền toàn bộ hệ sinh thái.",
             min_role="Cán bộ quản lý", lesson_count=12, sort_order=5),
        dict(id="c6", category_icon="🤖", title="Ứng dụng AI & Chuyển đổi số HKD",
             description="Sử dụng trí tuệ nhân tạo để viết bài quảng cáo, dự báo hàng tồn kho và tự động hóa sổ sách.",
             min_role="Thành viên", lesson_count=15, sort_order=6),
    ]
    for c in seed:
        db.add(Course(**c))
    db.commit()


def _seed_first_admin_if_empty(db: Session):
    """
    Nếu bảng members trống hoàn toàn, tạo sẵn 1 tài khoản Ban điều hành mặc định.
    Không có bước này thì sau khi đăng ký, không ai có quyền duyệt thành viên đầu tiên
    (đăng ký luôn ra role="Thành viên" + chưa có mật khẩu, chờ duyệt — nhưng chẳng có
    Ban điều hành nào tồn tại để đăng nhập và bấm Duyệt).
    """
    from app.models.models import Member
    from app.core.security import hash_password

    if db.query(Member).count() > 0:
        return

    admin_phone = settings.BOOTSTRAP_ADMIN_PHONE
    admin_password = settings.BOOTSTRAP_ADMIN_PASSWORD
    admin = Member(
        id="HTX369-0001",
        name="Ban điều hành (mặc định)",
        phone=admin_phone,
        password_hash=hash_password(admin_password),
        member_type="Thành viên chính thức",
        status="Chính thức",
        role="Ban điều hành",
        capital=0,
    )
    db.add(admin)
    db.commit()


_seed_db = next(get_db())
try:
    _seed_courses_if_empty(_seed_db)
    _seed_first_admin_if_empty(_seed_db)
finally:
    _seed_db.close()


def _current_session(token: str):
    """Giải mã cookie phiên — trả về dict {id, name, phone, role, status} hoặc None."""
    if not token:
        return None
    raw = decode_access_token(token)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None


@app.get("/api/health")
def health():
    return {"ok": True, "service": settings.PROJECT_NAME}


@app.post("/api/register")
def register(payload: dict = Body(...), db: Session = Depends(get_db)):
    result = AuthService.register(
        db,
        name=payload.get("name", ""),
        phone=payload.get("phone", ""),
        cccd=payload.get("cccd", ""),
        cccd_date=payload.get("cccd_date", ""),
        email=payload.get("email", ""),
        member_type=payload.get("member_type", "Thành viên chính thức"),
    )
    status_code = 200 if result["ok"] else 400
    return JSONResponse(content=result, status_code=status_code)


@app.post("/api/login")
def login(payload: dict = Body(...), db: Session = Depends(get_db)):
    phone = payload.get("phone", "")
    password = payload.get("password", "")
    result = AuthService.login(db, phone, password)
    if not result["ok"]:
        return JSONResponse(content=result, status_code=401)

    token = create_access_token(subject=json.dumps(result["data"]))
    resp = JSONResponse(content=result, status_code=200)
    resp.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="none",  # frontend (369-daotao.vercel.app) và backend (web369-backend.vercel.app)
                           # là 2 domain khác nhau — SameSite=Lax bị trình duyệt chặn không gửi cookie
                           # trên request fetch() cross-site, khiến /api/me luôn trả 401 sau khi login.
                           # SameSite=None (bắt buộc đi kèm Secure=True, đã có sẵn) mới cho phép cookie
                           # gửi kèm trên request cross-site qua fetch(credentials:'include').
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return resp


@app.post("/api/logout")
def logout():
    resp = JSONResponse(content={"ok": True})
    resp.delete_cookie(COOKIE_NAME, secure=True, samesite="none")
    return resp


@app.get("/api/me")
def me(w369_token: str = Cookie(default=None), db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    result = AuthService.me(db, session["id"])
    return result


@app.post("/api/change-password")
def change_password(payload: dict = Body(...), w369_token: str = Cookie(default=None),
                     db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    result = AuthService.change_password(
        db, session["id"], payload.get("old_password", ""), payload.get("new_password", "")
    )
    status_code = 200 if result["ok"] else 400
    return JSONResponse(content=result, status_code=status_code)


@app.get("/api/courses")
def list_courses(w369_token: str = Cookie(default=None), db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    if session["status"] not in settings.ALLOWED_STATUSES:
        return JSONResponse(content={
            "ok": False,
            "error": f"Tài khoản ở trạng thái '{session['status']}' — không có quyền xem khóa học. "
                     f"Theo Điều lệ HTX Gia đình 369, vui lòng liên hệ Ban điều hành để được xác minh."
        }, status_code=403)
    result = AuthService.list_courses(db, session["role"])
    return result


@app.post("/api/admin/approve-member")
def approve_member(payload: dict = Body(...), w369_token: str = Cookie(default=None),
                    db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    result = AuthService.approve_member(db, session["role"], payload.get("member_id", ""))
    status_code = 200 if result["ok"] else 403
    return JSONResponse(content=result, status_code=status_code)


@app.post("/api/admin/reset-password")
def reset_password(payload: dict = Body(...), w369_token: str = Cookie(default=None),
                    db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    result = AuthService.reset_password(db, session["role"], payload.get("member_id", ""))
    status_code = 200 if result["ok"] else 403
    return JSONResponse(content=result, status_code=status_code)


@app.post("/api/admin/create-member")
def create_member(payload: dict = Body(...), w369_token: str = Cookie(default=None),
                   db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)

    capital_raw = payload.get("capital")
    digits = "".join(ch for ch in str(capital_raw or "") if ch.isdigit())
    capital_int = int(digits) if digits else 0

    result = AuthService.admin_create_member(
        db, session["role"],
        name=payload.get("name", ""),
        phone=payload.get("phone", ""),
        cccd=payload.get("cccd", ""),
        cccd_date=payload.get("cccd_date", ""),
        email=payload.get("email", ""),
        member_type=payload.get("member_type", ""),
        capital=capital_int,
        status=payload.get("status", ""),
    )
    status_code = 200 if result["ok"] else 403
    return JSONResponse(content=result, status_code=status_code)


@app.post("/api/admin/update-member")
def update_member(payload: dict = Body(...), w369_token: str = Cookie(default=None),
                   db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)

    capital_raw = payload.get("capital")
    capital_int = None
    if capital_raw is not None:
        digits = "".join(ch for ch in str(capital_raw) if ch.isdigit())
        capital_int = int(digits) if digits else 0

    result = AuthService.update_member(
        db, session["role"], payload.get("member_id", ""),
        name=payload.get("name"),
        phone=payload.get("phone"),
        cccd=payload.get("cccd"),
        cccd_date=payload.get("cccd_date"),
        email=payload.get("email"),
        member_type=payload.get("member_type"),
        status=payload.get("status"),
        capital=capital_int,
    )
    status_code = 200 if result["ok"] else 403
    return JSONResponse(content=result, status_code=status_code)


@app.post("/api/admin/delete-member")
def delete_member(payload: dict = Body(...), w369_token: str = Cookie(default=None),
                   db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    result = AuthService.delete_member(db, session["role"], session["id"], payload.get("member_id", ""))
    status_code = 200 if result["ok"] else 403
    return JSONResponse(content=result, status_code=status_code)


@app.get("/api/admin/members")
def list_members(w369_token: str = Cookie(default=None), db: Session = Depends(get_db)):
    session = _current_session(w369_token)
    if not session:
        return JSONResponse(content={"ok": False, "error": "Chưa đăng nhập."}, status_code=401)
    if session["role"] not in settings.APPROVER_ROLES:
        return JSONResponse(content={
            "ok": False,
            "error": "Yêu cầu vai trò Ban điều hành hoặc Cán bộ quản lý để xem Sổ đăng ký thành viên."
        }, status_code=403)
    result = AuthService.list_members(db)
    return result
