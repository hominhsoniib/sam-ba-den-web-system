// Trang "đang xây dựng" cho các module sẽ ráp ở vòng sau.
// Mỗi module thật sẽ thay trang này bằng list + form gọi API tương ứng.
export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="dash">
      <div className="dash-head">
        <h1>{title}</h1>
        <p>
          Khu vực này sẽ được ráp vào ở vòng phát triển tiếp theo, dùng lại nền
          xác thực &amp; phân quyền hiện có.
        </p>
      </div>
      <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-faint)" }}>
        Chưa có dữ liệu để hiển thị.
      </div>
    </div>
  );
}
