import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Seo from "../components/Seo";
import { fmtVnd, product, type ProductDetail } from "../lib/api";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [p, setP] = useState<ProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setP(null);
    setNotFound(false);
    setActiveImg(0);
    void product
      .detail(slug)
      .then((x) => (x ? setP(x) : setNotFound(true)))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container section">
        <h1>Không tìm thấy sản phẩm</h1>
        <p className="muted">
          <Link to="/san-pham">Quay lại danh sách sản phẩm</Link>
        </p>
      </div>
    );
  }
  if (!p) {
    return (
      <div className="container section">
        <p className="muted">Đang tải…</p>
      </div>
    );
  }

  const images = p.images.length
    ? p.images
    : [{ id: "ph", image_url: "", alt_text: p.name, is_primary: true, sort_order: 0 }];

  return (
    <article>
      <Seo seo={p.seo} jsonLd={p.json_ld} />

      <div className="container product-detail">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link> <span>/</span>{" "}
          <Link to="/san-pham">Sản phẩm</Link> <span>/</span>{" "}
          <Link to={`/san-pham?danh-muc=${p.category.slug}`}>
            {p.category.name}
          </Link>
        </nav>

        <div className="pd-grid">
          {/* Gallery */}
          <div className="pd-gallery">
            <div className="pd-main-img">
              {images[activeImg].image_url ? (
                <img src={images[activeImg].image_url} alt={p.name} />
              ) : (
                <div className="pd-ph">SBĐ</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((im, i) => (
                  <button
                    key={im.id}
                    className={"pd-thumb" + (i === activeImg ? " active" : "")}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Ảnh ${i + 1}`}
                  >
                    <img src={im.image_url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info">
            <span className="article-cat">{p.category.name}</span>
            <h1 className="pd-title">{p.name}</h1>
            {p.short_desc && <p className="pd-short">{p.short_desc}</p>}

            <div className="pd-price-box">
              <span className="pd-price">{fmtVnd(p.reference_price)}</span>
              {p.unit && <span className="pd-unit">/ {p.unit}</span>}
            </div>

            <div className="pd-cta">
              <a href="#lien-he" className="btn btn-primary">
                Liên hệ đặt mua
              </a>
              <a href="#lien-he" className="btn btn-outline">
                Nhận tư vấn
              </a>
            </div>

            {p.usage_info && (
              <div className="pd-section">
                <h3>Hướng dẫn sử dụng</h3>
                <p>{p.usage_info}</p>
              </div>
            )}

            {p.disclaimer && <p className="disclaimer">{p.disclaimer}</p>}
          </div>
        </div>

        {/* Mô tả chi tiết */}
        {p.description && (
          <div className="pd-description">
            <h2>Mô tả sản phẩm</h2>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: p.description }}
            />
          </div>
        )}
      </div>

      {/* Liên quan */}
      {p.related.length > 0 && (
        <div className="container section">
          <h2 className="related-head">Sản phẩm liên quan</h2>
          <div className="prod-grid">
            {p.related.map((r) => (
              <Link
                key={r.id}
                to={`/san-pham/${r.slug}`}
                className="prod-card"
              >
                <div className="prod-card-img">
                  {r.primary_image ? (
                    <img src={r.primary_image} alt={r.name} />
                  ) : (
                    <div className="prod-card-ph">SBĐ</div>
                  )}
                </div>
                <div className="prod-card-body">
                  <span className="prod-card-cat">{r.category.name}</span>
                  <h3>{r.name}</h3>
                  <div className="prod-card-foot">
                    <span className="prod-price">
                      {fmtVnd(r.reference_price)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
