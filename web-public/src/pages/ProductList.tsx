import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Seo from "../components/Seo";
import { fmtVnd, product, type ProductListItem } from "../lib/api";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";

export default function ProductList() {
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void product
      .list()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Seo
        seo={{
          title: "Sản phẩm Sâm Bà Đen — Dược liệu chính hãng",
          description:
            "Các sản phẩm sâm Bà Đen từ vùng Núi Bà Đen, Tây Ninh: sâm tươi, trà sâm, sản phẩm chế biến — an toàn, chất lượng.",
          canonical_url: SITE + "/san-pham",
          robots: "index,follow",
        }}
      />
      <div className="container page-top">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link> <span>/</span> <span>Sản phẩm</span>
        </nav>
        <h1 className="page-title">Sản phẩm Sâm Bà Đen</h1>
        <p className="page-lead">
          Dược liệu bản địa từ Núi Bà Đen — tuyển chọn, an toàn, rõ nguồn gốc.
        </p>
      </div>

      <div className="container section">
        {loading ? (
          <p className="muted">Đang tải…</p>
        ) : items.length === 0 ? (
          <p className="muted">Chưa có sản phẩm nào.</p>
        ) : (
          <div className="prod-grid">
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/san-pham/${p.slug}`}
                className="prod-card"
              >
                <div className="prod-card-img">
                  {p.primary_image ? (
                    <img src={p.primary_image} alt={p.name} />
                  ) : (
                    <div className="prod-card-ph">SBĐ</div>
                  )}
                </div>
                <div className="prod-card-body">
                  <span className="prod-card-cat">{p.category.name}</span>
                  <h3>{p.name}</h3>
                  {p.short_desc && <p>{p.short_desc}</p>}
                  <div className="prod-card-foot">
                    <span className="prod-price">
                      {fmtVnd(p.reference_price)}
                      {p.unit && (
                        <span className="prod-unit"> / {p.unit}</span>
                      )}
                    </span>
                    <span className="prod-cta">Xem chi tiết →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
