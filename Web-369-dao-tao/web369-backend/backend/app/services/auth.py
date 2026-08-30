import random
from sqlalchemy.orm import Session
from app.models.models import Member, Course
from app.core.security import hash_password, verify_password
from app.core.config import settings


def _ok(data=None):
    return {"ok": True, "data": data}


def _fail(error: str):
    return {"ok": False, "error": error}


def _next_member_id(db: Session) -> str:
    count = db.query(Member).count()
    return f"HTX369-{count + 1:04d}"


class AuthService:

    @staticmethod
    def register(db: Session, name: str, phone: str, cccd: str, cccd_date: str,
                  email: str, member_type: str) -> dict:
        if db.query(Member).filter(Member.phone == phone).first():
            return _fail("Số điện thoại này đã đăng ký thành viên trước đó.")

        member = Member(
            id=_next_member_id(db),
            name=name,
            phone=phone,
            cccd=cccd,
            cccd_date=cccd_date,
            email=email,
            member_type=member_type or "Thành viên chính thức",
            status="Đang chờ xác nhận",
            role="Thành viên",
            capital=0,
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return _ok({
            "id": member.id,
            "status": member.status,
            "message": "Đã nộp đơn đăng ký. Vui lòng chờ Ban điều hành duyệt hồ sơ."
        })

    @staticmethod
    def login(db: Session, phone: str, password: str) -> dict:
        member = db.query(Member).filter(Member.phone == phone).first()
        if not member:
            return _fail("Số điện thoại chưa đăng ký thành viên.")
        if not member.password_hash:
            return _fail("Tài khoản chưa được kích hoạt mật khẩu — hồ sơ đang chờ Ban điều hành duyệt.")
        if not verify_password(password, member.password_hash):
            return _fail("Sai mật khẩu.")

        session_data = {
            "id": member.id,
            "name": member.name,
            "phone": member.phone,
            "role": member.role,
            "status": member.status,
        }
        return _ok(session_data)

    @staticmethod
    def me(db: Session, member_id: str) -> dict:
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return _fail("Không tìm thấy thành viên.")
        return _ok({
            "id": member.id,
            "name": member.name,
            "phone": member.phone,
            "role": member.role,
            "status": member.status,
            "member_type": member.member_type,
            "cccd": member.cccd,
            "cccd_date": member.cccd_date,
            "email": member.email,
            "capital": member.capital,
            "competency_points": member.competency_points,
            "certificates": member.certificates,
            "badges": member.badges,
            "joined_date": member.joined_date.strftime("%d/%m/%Y") if member.joined_date else None,
        })

    @staticmethod
    def change_password(db: Session, member_id: str, old_password: str, new_password: str) -> dict:
        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return _fail("Không tìm thấy thành viên.")
        if not verify_password(old_password, member.password_hash):
            return _fail("Mật khẩu hiện tại không đúng.")
        if len(new_password) < 6:
            return _fail("Mật khẩu mới phải có ít nhất 6 ký tự.")
        member.password_hash = hash_password(new_password)
        db.commit()
        return _ok(True)

    @staticmethod
    def approve_member(db: Session, approver_role: str, member_id: str) -> dict:
        if approver_role not in settings.APPROVER_ROLES:
            return _fail("Bạn không có quyền duyệt thành viên (yêu cầu vai trò Ban điều hành hoặc Cán bộ quản lý).")

        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return _fail("Không tìm thấy hồ sơ thành viên.")
        if member.status == "Chính thức":
            return _fail("Thành viên này đã ở trạng thái Chính thức.")

        temp_password = str(random.randint(100000, 999999))
        member.status = "Chính thức"
        member.password_hash = hash_password(temp_password)
        db.commit()

        return _ok({
            "id": member.id,
            "name": member.name,
            "status": member.status,
            "temp_password": temp_password,
            "note": "Mật khẩu tạm chỉ hiển thị một lần — hãy gửi cho thành viên qua kênh liên lạc an toàn."
        })

    @staticmethod
    def list_courses(db: Session, member_role: str) -> dict:
        courses = db.query(Course).order_by(Course.sort_order).all()
        my_rank = settings.ROLE_RANK.get(member_role, 0)
        result = []
        for c in courses:
            required_rank = settings.ROLE_RANK.get(c.min_role, 0)
            locked = my_rank < required_rank
            result.append({
                "id": c.id,
                "icon": c.category_icon,
                "title": c.title,
                # Chỉ trả mô tả chi tiết khi thành viên đủ quyền — kiểm tra thật ở server, không phải CSS ẩn/hiện
                "description": None if locked else c.description,
                "min_role": c.min_role,
                "lesson_count": c.lesson_count,
                "locked": locked,
            })
        return _ok(result)

    @staticmethod
    def list_members(db: Session) -> dict:
        members = db.query(Member).order_by(Member.joined_date.desc()).all()
        result = []
        for m in members:
            result.append({
                "id": m.id,
                "name": m.name,
                "phone": m.phone,
                "cccd": m.cccd,
                "cccd_date": m.cccd_date,
                "email": m.email,
                "member_type": m.member_type,
                "status": m.status,
                "role": m.role,
                "capital": m.capital,
                "has_password": bool(m.password_hash),
            })
        return _ok(result)
