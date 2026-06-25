import { useState } from "react";
import { Link } from "react-router-dom";

import Seo from "../components/Seo";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_DATA: FaqItem[] = [
  // Sản phẩm
  {
    category: "Sản phẩm",
    q: "Sâm Bố Chính Bà Đen là gì?",
    a: "Sâm Bố Chính (Abelmoschus sagittifolius) là loài dược liệu quý đã được ghi chép trong y học cổ truyền Việt Nam hàng trăm năm. Bà Đen Farm trồng giống sâm này trên vùng đất Núi Bà Đen, Tây Ninh theo quy trình hữu cơ nghiêm ngặt, hoàn toàn không dùng hóa chất.",
  },
  {
    category: "Sản phẩm",
    q: "Sản phẩm Bà Đen Farm có những loại nào? Giá bao nhiêu?",
    a: "Hiện tại có 3 dòng chính: Bột Sâm Bố Chính (170.000 ₫), Hoa Sâm Bố Chính (80.000 ₫), Trà Sâm Bố Chính túi lọc (120.000 ₫). Sâm tươi nguyên củ từ 200.000 – 400.000 ₫/kg. Ngoài ra có sâm sấy lát, rượu sâm.",
  },
  {
    category: "Sản phẩm",
    q: "Sản phẩm có an toàn không? Có chứng nhận gì?",
    a: "Tất cả sản phẩm đều đạt chứng nhận OCOP 4 sao, VietGAP, GlobalGAP, ISO 22000 và an toàn thực phẩm theo quy định Bộ Y tế. Quy trình canh tác hữu cơ 100% — không hóa chất. Hàm lượng Saponin tổng đạt 15,2 mg/g.",
  },
  {
    category: "Sản phẩm",
    q: "Sâm Bà Đen có phải là thuốc không?",
    a: "Sâm Bà Đen là thực phẩm bổ dưỡng / thực phẩm bảo vệ sức khỏe. Sản phẩm không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.",
  },
  // Mua hàng
  {
    category: "Mua hàng",
    q: "Làm sao để mua sản phẩm Bà Đen Farm?",
    a: "Bạn có thể mua qua website badenfarm.com.vn, gọi hotline 0919.257.757 / 0981.557.957, nhắn Zalo số 0919.257.757, hoặc tìm đại lý gần nhất tại trang Hệ thống Đại lý.",
  },
  {
    category: "Mua hàng",
    q: "Có giao hàng toàn quốc không?",
    a: "Có. Giao miễn phí cho khách hàng trong TP. Tây Ninh. Các tỉnh khác giao qua đơn vị vận chuyển toàn quốc. Thanh toán qua chuyển khoản MB Bank (số TK: 1983 3939 6868) hoặc COD (tiền mặt khi nhận hàng).",
  },
  {
    category: "Mua hàng",
    q: "Chính sách đổi trả như thế nào?",
    a: "Đổi trả trong 7 ngày nếu sản phẩm lỗi từ nhà sản xuất. Sản phẩm phải còn nguyên bao bì, chưa sử dụng. Vui lòng liên hệ hotline để được hỗ trợ.",
  },
  // Đại lý
  {
    category: "Đại lý",
    q: "Muốn trở thành đại lý cần điều kiện gì?",
    a: "Bạn cần có cửa hàng hoặc kênh bán hàng, cam kết doanh số tối thiểu và tuân thủ chính sách giá. Đăng ký tại trang Đại lý hoặc gọi hotline.",
  },
  {
    category: "Đại lý",
    q: "Chính sách chiết khấu cho đại lý thế nào?",
    a: "Chiết khấu từ 15-30% tùy cấp đại lý (Cấp 1, Cấp 2). Thêm thưởng doanh số theo quý. Chi tiết liên hệ phòng kinh doanh.",
  },
  // Vùng trồng
  {
    category: "Vùng trồng",
    q: "Có thể tham quan vùng trồng được không?",
    a: "Có. Chúng tôi tổ chức tour tham quan vùng trồng tại Núi Bà Đen theo lịch hẹn. Vui lòng liên hệ trước ít nhất 3 ngày.",
  },
  {
    category: "Vùng trồng",
    q: "QR Code truy xuất nguồn gốc hoạt động thế nào?",
    a: "Mỗi sản phẩm có mã QR riêng. Khi quét, bạn sẽ thấy: thông tin lô trồng, nhật ký canh tác, ngày thu hoạch, chứng nhận chất lượng và hình ảnh thực tế.",
  },
];

const CATEGORIES = [...new Set(FAQ_DATA.map((f) => f.category))];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = FAQ_DATA.filter((f) => f.category === activeCategory);

  return (
    <>
      <Seo
        seo={{
          title: "Câu hỏi thường gặp (FAQ) — Sâm Bà Đen",
          description:
            "Giải đáp câu hỏi thường gặp về sản phẩm Sâm Bà Đen: mua hàng, đại lý, vùng trồng, chứng nhận.",
          canonical_url: SITE + "/faq",
          robots: "index,follow",
        }}
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_DATA.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: f.a,
              },
            })),
          },
        ]}
      />

      <div className="container page-top">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link> <span>/</span> <span>FAQ</span>
        </nav>
        <h1 className="page-title">Câu hỏi thường gặp</h1>
        <p className="page-lead">
          Tìm câu trả lời nhanh cho những thắc mắc phổ biến nhất về Sâm Bà Đen.
        </p>
      </div>

      <section className="container section">
        {/* Category tabs */}
        <div className="faq-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`faq-tab ${cat === activeCategory ? "faq-tab-active" : ""}`}
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(0);
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="faq-list">
          {filtered.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={f.q} className={`faq-item ${isOpen ? "faq-item-open" : ""}`}>
                <button
                  className="faq-question"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span>{f.q}</span>
                  <span className="faq-chevron" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{f.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <div className="container about-cta-inner">
          <h2>Chưa tìm thấy câu trả lời?</h2>
          <p>Liên hệ trực tiếp — đội ngũ sẽ hỗ trợ bạn trong thời gian sớm nhất.</p>
          <div className="about-cta-btns">
            <Link to="/lien-he" className="btn btn-primary">
              Liên hệ ngay
            </Link>
            <a href="tel:+84909000001" className="btn btn-outline">
              Gọi hotline
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
