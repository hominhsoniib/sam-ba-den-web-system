import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Seo from "../components/Seo";
import { blog, fmtDate, type PostDetail } from "../lib/api";

export default function PostDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setPost(null);
    setNotFound(false);
    void blog
      .detail(slug)
      .then((p) => (p ? setPost(p) : setNotFound(true)))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container section">
        <h1>Không tìm thấy bài viết</h1>
        <p className="muted">
          Bài viết có thể đã bị gỡ. <Link to="/blog">Quay lại Blog</Link>
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container section">
        <p className="muted">Đang tải…</p>
      </div>
    );
  }

  return (
    <article>
      <Seo seo={post.seo} jsonLd={post.json_ld} />

      <div className="container article-head">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link> <span>/</span>{" "}
          <Link to="/blog">Blog</Link> <span>/</span>{" "}
          <Link to={`/blog?danh-muc=${post.category.slug}`}>
            {post.category.name}
          </Link>
        </nav>
        <span className="article-cat">{post.category.name}</span>
        <h1 className="article-title">{post.title}</h1>
        <div className="article-meta">
          <span>{post.author_name}</span>
          {post.published_at && (
            <>
              <span className="dot">•</span>
              <span>{fmtDate(post.published_at)}</span>
            </>
          )}
        </div>
      </div>

      {post.cover_image_url && (
        <div className="container">
          <img
            className="article-cover"
            src={post.cover_image_url}
            alt={post.title}
          />
        </div>
      )}

      <div className="container article-body">
        {/* Nội dung do biên tập tạo (HTML đã được kiểm soát phía admin) */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags.length > 0 && (
          <div className="article-tags">
            {post.tags.map((t) => (
              <span key={t.id} className="tag-chip">
                #{t.name}
              </span>
            ))}
          </div>
        )}

        {post.disclaimer && (
          <p className="disclaimer">{post.disclaimer}</p>
        )}
      </div>

      {post.related.length > 0 && (
        <div className="container section">
          <h2 className="related-head">Bài viết liên quan</h2>
          <div className="post-grid">
            {post.related.map((r) => (
              <Link key={r.id} to={`/blog/${r.slug}`} className="post-card">
                <div className="post-card-cover">
                  <div className="post-card-placeholder">SBĐ</div>
                </div>
                <div className="post-card-body">
                  <span className="post-card-cat">{r.category.name}</span>
                  <h3>{r.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
