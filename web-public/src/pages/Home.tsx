import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Seo from "../components/Seo";
import { blog, fmtDate, product, type PostListItem, type ProductListItem } from "../lib/api";
import { fmtVnd } from "../lib/api";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:4174";

export default function Home() {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    void blog.list(undefined, 1).then(({ items }) => setPosts(items.slice(0, 3)));
    void product.list().then((items) => setProducts(items.slice(0, 3)));
  }, []);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sâm Bà Đen",
    url: SITE,
    description:
      "Dược liệu Sâm Bà Đen bản địa từ vùng Núi Bà Đen, Tây Ninh.",
  };

  return (
    <>
      <Seo
        seo={{
          title: "Sâm Bà Đen — Báu vật dược liệu từ Núi Thiêng Nam Bộ",
          description:
            "Sâm Bà Đen — dược liệu bản địa quý từ vùng Núi Bà Đen, Tây Ninh. An toàn, chất lượng, gắn với câu chuyện núi thiêng.",
          canonical_url: SITE + "/",
          robots: "index,follow",
        }}
        jsonLd={[orgJsonLd]}
      />

      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <span className="hero-eyebrow">Dược liệu bản địa · OCOP Tây Ninh</span>
          <h1 className="hero-title">
            Báu vật dược liệu
            <br />
            từ Núi Thiêng Nam Bộ
          </h1>
          <p className="hero-sub">
            Sâm Bà Đen mang trong mình tinh túy của vùng Núi Bà Đen — được
            chăm trồng tự nhiên, an toàn và gìn giữ theo cách của người Việt.
          </p>
          <div className="hero-cta">
            <Link to="/blog" className="btn btn-primary">
              Tìm hiểu kiến thức
            </Link>
            <a href="#lien-he" className="btn btn-outline">
              Nhận tư vấn
            </a>
          </div>
        </div>
        <div className="hero-ridge" aria-hidden="true" />
      </section>

      {/* Thanh tin cậy */}
      <section className="container trust-row">
        {["Chứng nhận OCOP", "Vùng trồng Núi Bà Đen", "Quy trình tự nhiên", "Người Việt dùng sâm Việt"].map(
          (t) => (
            <div key={t} className="trust-item">
              {t}
            </div>
          ),
        )}
      </section>

      {/* Sản phẩm nổi bật */}
      {products.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Sản phẩm nổi bật</h2>
            <Link to="/san-pham" className="section-link">
              Xem tất cả →
            </Link>
          </div>
          <div className="prod-grid">
            {products.map((p) => (
              <Link key={p.id} to={`/san-pham/${p.slug}`} className="prod-card">
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
                      {p.unit && <span className="prod-unit"> / {p.unit}</span>}
                    </span>
                    <span className="prod-cta">Xem →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Blog mới nhất */}
      <section className="container section">
        <div className="section-head">
          <h2>Kiến thức &amp; Câu chuyện</h2>
          <Link to="/blog" className="section-link">
            Xem tất cả →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p className="muted">Chưa có bài viết.</p>
        ) : (
          <div className="post-grid">
            {posts.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="post-card">
                <div className="post-card-cover">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} />
                  ) : (
                    <div className="post-card-placeholder">SBĐ</div>
                  )}
                </div>
                <div className="post-card-body">
                  <span className="post-card-cat">{p.category.name}</span>
                  <h3>{p.title}</h3>
                  {p.excerpt && <p>{p.excerpt}</p>}
                  <span className="post-card-date">
                    {fmtDate(p.published_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
