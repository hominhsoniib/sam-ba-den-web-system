import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { errorMessage } from "../lib/api";
import { blogApi, STATUS_META, type PostPayload } from "../lib/blogApi";
import type { Category, PostDetail, PostStatus } from "../lib/types";
import { useAuth } from "../store/auth";

const SITE = "https://sambaden.vn";

// Hành động workflow khả dụng theo trạng thái hiện tại
function actionsFor(status: PostStatus, canPublish: boolean) {
  switch (status) {
    case "draft":
      return [
        { action: "submit", label: "Gửi duyệt", primary: false },
        ...(canPublish
          ? [{ action: "publish", label: "Xuất bản ngay", primary: true }]
          : []),
      ];
    case "review":
      return canPublish
        ? [
            { action: "approve", label: "Duyệt & xuất bản", primary: true },
            { action: "back_to_draft", label: "Trả về nháp", primary: false },
          ]
        : [{ action: "back_to_draft", label: "Trả về nháp", primary: false }];
    case "published":
      return [{ action: "archive", label: "Lưu trữ", primary: false }];
    case "archived":
      return [{ action: "back_to_draft", label: "Khôi phục nháp", primary: false }];
    default:
      return [];
  }
}

export default function PostEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const canPublish = useAuth((s) => s.can("post.publish"));

  const [cats, setCats] = useState<Category[]>([]);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // form fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [disclaimer, setDisclaimer] = useState(
    "Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.",
  );

  useEffect(() => {
    void (async () => {
      const c = await blogApi.listCategories();
      setCats(c);
      if (isNew && c[0]) setCategoryId(c[0].id);
      if (!isNew) {
        const full = await blogApi.getPost(id!);
        hydrate(full);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function hydrate(p: PostDetail) {
    setPost(p);
    setTitle(p.title);
    setExcerpt(p.excerpt ?? "");
    setContent(p.content);
    setCategoryId(p.category.id);
    setTags(p.tags.map((t) => t.name).join(", "));
    setSeoTitle(p.seo_title ?? "");
    setSeoDesc(p.seo_description ?? "");
    setDisclaimer(p.disclaimer ?? "");
  }

  const previewSlug = useMemo(
    () =>
      (title || "tieu-de-bai-viet")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    [title],
  );

  function buildPayload(): PostPayload {
    return {
      title,
      content,
      excerpt: excerpt || undefined,
      category_id: categoryId,
      tag_names: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      seo_title: seoTitle || undefined,
      seo_description: seoDesc || undefined,
      disclaimer: disclaimer || undefined,
    };
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      if (isNew) {
        const created = await blogApi.createPost(buildPayload());
        navigate(`/posts/${created.id}`, { replace: true });
        hydrate(created);
      } else {
        const updated = await blogApi.updatePost(id!, buildPayload());
        hydrate(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: string) {
    setBusy(true);
    setError(null);
    try {
      const updated = await blogApi.changeStatus(id!, action);
      hydrate(updated);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const status = post?.status ?? "draft";
  const st = STATUS_META[status as PostStatus];
  const metaTitle = seoTitle || title || "Tiêu đề bài viết";
  const metaDesc =
    seoDesc || excerpt || "Mô tả SEO sẽ hiển thị ở đây khi bạn nhập.";

  return (
    <div className="editor">
      <div className="page-head">
        <div>
          <button className="btn btn-ghost" onClick={() => navigate("/posts")}>
            ← Danh sách
          </button>
        </div>
        <div className="editor-actions">
          {!isNew && <span className={"status-pill " + st.cls}>{st.label}</span>}
          {saved && <span className="saved-tag">✓ Đã lưu</span>}
          <button className="btn btn-ghost" onClick={save} disabled={busy}>
            {busy ? "Đang lưu…" : isNew ? "Tạo bản nháp" : "Lưu thay đổi"}
          </button>
          {!isNew &&
            actionsFor(status as PostStatus, canPublish).map((a) => (
              <button
                key={a.action}
                className={"btn " + (a.primary ? "btn-primary" : "btn-ghost")}
                onClick={() => runAction(a.action)}
                disabled={busy}
              >
                {a.label}
              </button>
            ))}
        </div>
      </div>

      {error && <div className="alert alert-err">{error}</div>}

      <div className="editor-grid">
        {/* Cột soạn thảo */}
        <div className="editor-main card">
          <div className="field">
            <label className="label">Tiêu đề</label>
            <input
              className="input input-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Sâm Bà Đen — Báu vật Núi Thiêng"
            />
          </div>
          <div className="field">
            <label className="label">Tóm tắt (excerpt)</label>
            <textarea
              className="input"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="1–2 câu mô tả ngắn, dùng cho danh sách & mạng xã hội"
            />
          </div>
          <div className="field">
            <label className="label">Nội dung (HTML)</label>
            <textarea
              className="input mono"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Nội dung bài viết…</p>"
            />
          </div>
          <div className="field">
            <label className="label">
              Khuyến cáo tuân thủ (bắt buộc với nội dung sức khỏe)
            </label>
            <textarea
              className="input"
              rows={2}
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
            />
          </div>
        </div>

        {/* Cột phụ: phân loại + SEO + preview */}
        <div className="editor-side">
          <div className="card side-card">
            <h4>Phân loại</h4>
            <div className="field">
              <label className="label">Danh mục</label>
              <select
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Thẻ (phân tách bằng dấu phẩy)</label>
              <input
                className="input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="sâm, Tây Ninh, sức khỏe"
              />
            </div>
          </div>

          <div className="card side-card">
            <h4>Tối ưu SEO</h4>
            <div className="field">
              <label className="label">
                SEO Title{" "}
                <span className="counter">{metaTitle.length}/60</span>
              </label>
              <input
                className="input"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Để trống = dùng tiêu đề bài"
              />
            </div>
            <div className="field">
              <label className="label">
                Meta Description{" "}
                <span className="counter">{metaDesc.length}/160</span>
              </label>
              <textarea
                className="input"
                rows={3}
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
              />
            </div>

            {/* Google snippet preview */}
            <div className="seo-preview">
              <div className="seo-preview-label">Xem trước trên Google</div>
              <div className="g-snippet">
                <div className="g-url">
                  {SITE}/blog/{previewSlug}
                </div>
                <div className="g-title">{metaTitle}</div>
                <div className="g-desc">{metaDesc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
