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


def _gen_temp_password() -> str:
    return str(random.randint(100000, 999999))


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
            "must_change_password": bool(member.must_change_password),
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
            "must_change_password": bool(member.must_change_password),
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
        member.must_change_password = False
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

        temp_password = _gen_temp_password()
        member.status = "Chính thức"
        member.password_hash = hash_password(temp_password)
        member.must_change_password = True
        db.commit()

        return _ok({
            "id": member.id,
            "name": member.name,
            "status": member.status,
            "temp_password": temp_password,
            "note": "Mật khẩu tạm chỉ hiển thị một lần — hãy gửi cho thành viên qua kênh liên lạc an toàn."
        })

    @staticmethod
    def reset_password(db: Session, approver_role: str, member_id: str) -> dict:
        """
        Cấp lại mật khẩu tạm cho thành viên bất kỳ (không đổi status, không yêu cầu
        đang ở trạng thái chờ duyệt) — dùng khi: quên mật khẩu, hoặc thành viên đang
        "Đang chờ xác nhận" cần đăng nhập tạm trước khi Ban điều hành duyệt hồ sơ đầy đủ.
        Bắt buộc thành viên đổi mật khẩu ở lần đăng nhập kế tiếp (must_change_password).
        """
        if approver_role not in settings.APPROVER_ROLES:
            return _fail("Bạn không có quyền cấp mật khẩu (yêu cầu vai trò Ban điều hành hoặc Cán bộ quản lý).")

        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return _fail("Không tìm thấy hồ sơ thành viên.")

        temp_password = _gen_temp_password()
        member.password_hash = hash_password(temp_password)
        member.must_change_password = True
        db.commit()

        return _ok({
            "id": member.id,
            "name": member.name,
            "status": member.status,
            "temp_password": temp_password,
            "note": "Mật khẩu tạm chỉ hiển thị một lần — hãy gửi cho thành viên qua kênh liên lạc an toàn. "
                    "Thành viên sẽ bị bắt buộc đổi mật khẩu ngay ở lần đăng nhập đầu tiên."
        })

    @staticmethod
    def admin_create_member(db: Session, approver_role: str, name: str, phone: str, cccd: str,
                             cccd_date: str, email: str, member_type: str, capital: int,
                             status: str) -> dict:
        if approver_role not in settings.APPROVER_ROLES:
            return _fail("Bạn không có quyền thêm thành viên mới (yêu cầu vai trò Ban điều hành hoặc Cán bộ quản lý).")

        if not name or not phone:
            return _fail("Họ tên và Số điện thoại là bắt buộc.")

        if db.query(Member).filter(Member.phone == phone).first():
            return _fail(f"Số điện thoại {phone} đã được dùng bởi thành viên khác.")

        member = Member(
            id=_next_member_id(db),
            name=name,
            phone=phone,
            cccd=cccd,
            cccd_date=cccd_date,
            email=email,
            member_type=member_type or "Thành viên chính thức",
            status=status or "Chính thức",
            role="Thành viên",
            capital=capital or 0,
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return _ok({
            "id": member.id,
            "name": member.name,
            "phone": member.phone,
            "cccd": member.cccd,
            "cccd_date": member.cccd_date,
            "email": member.email,
            "member_type": member.member_type,
            "status": member.status,
            "role": member.role,
            "capital": member.capital,
            "has_password": False,
            "must_change_password": False,
        })

    @staticmethod
    def update_member(db: Session, approver_role: str, member_id: str, **fields) -> dict:
        if approver_role not in settings.APPROVER_ROLES:
            return _fail("Bạn không có quyền chỉnh sửa hồ sơ thành viên (yêu cầu vai trò Ban điều hành hoặc Cán bộ quản lý).")

        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return _fail("Không tìm thấy hồ sơ thành viên.")

        new_phone = fields.get("phone")
        if new_phone and new_phone != member.phone:
            clash = db.query(Member).filter(Member.phone == new_phone, Member.id != member_id).first()
            if clash:
                return _fail(f"Số điện thoại {new_phone} đã được dùng bởi thành viên khác ({clash.id}).")
            member.phone = new_phone

        if fields.get("name"):
            member.name = fields["name"]
        if "cccd" in fields:
            member.cccd = fields["cccd"]
        if "cccd_date" in fields:
            member.cccd_date = fields["cccd_date"]
        if "email" in fields:
            member.email = fields["email"]
        if fields.get("member_type"):
            member.member_type = fields["member_type"]
        if fields.get("status"):
            member.status = fields["status"]
        if "capital" in fields and fields["capital"] is not None:
            member.capital = fields["capital"]

        db.commit()
        db.refresh(member)
        return _ok({
            "id": member.id,
            "name": member.name,
            "phone": member.phone,
            "cccd": member.cccd,
            "cccd_date": member.cccd_date,
            "email": member.email,
            "member_type": member.member_type,
            "status": member.status,
            "role": member.role,
            "capital": member.capital,
            "has_password": bool(member.password_hash),
            "must_change_password": bool(member.must_change_password),
        })

    @staticmethod
    def delete_member(db: Session, approver_role: str, approver_id: str, member_id: str) -> dict:
        if approver_role not in settings.APPROVER_ROLES:
            return _fail("Bạn không có quyền xóa hồ sơ thành viên (yêu cầu vai trò Ban điều hành hoặc Cán bộ quản lý).")

        if member_id == approver_id:
            return _fail("Không thể tự xóa hồ sơ của chính mình khi đang đăng nhập.")

        member = db.query(Member).filter(Member.id == member_id).first()
        if not member:
            return _fail("Không tìm thấy hồ sơ thành viên.")

        if member.role == "Ban điều hành":
            remaining_admins = db.query(Member).filter(
                Member.role == "Ban điều hành", Member.id != member_id
            ).count()
            if remaining_admins == 0:
                return _fail("Không thể xóa — đây là tài khoản Ban điều hành cuối cùng còn lại trong hệ thống.")

        deleted_name = member.name
        db.delete(member)
        db.commit()
        return _ok({"id": member_id, "name": deleted_name})

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
                "must_change_password": bool(m.must_change_password),
            })
        return _ok(result)
