import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { blogApi, STATUS_META } from "../lib/blogApi";
import type { PostListItem, PostStatus } from "../lib/types";
import { useAuth } from "../store/auth";

const FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "draft", label: "Bản nháp" },
  { key: "review", label: "Chờ duyệt" },
  { key: "published", label: "Đã xuất bản" },
  { key: "archived", label: "Lưu trữ" },
];

export default function PostList() {
  const navigate = useNavigate();
  const canWrite = useAuth((s) => s.can("post.write"));
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(status: string) {
    setLoading(true);
    try {
      const { items } = await blogApi.listPosts(status || undefined);
      setItems(items);
    } finally {
      setLoading(false);
    }
  }

  // load lần đầu
  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilter(key: string) {
    setFilter(key);
    void load(key);
  }

  return (
    <div className="dash">
      <div className="page-head">
        <div>
          <h1>Bài viết &amp; Blog SEO</h1>
          <p>Quản lý nội dung, tối ưu SEO và xuất bản theo quy trình duyệt.</p>
        </div>
        {canWrite && (
          <button
            className="btn btn-primary"
            onClick={() => navigate("/posts/new")}
          >
            + Viết bài mới
          </button>
        )}
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={"chip" + (filter === f.key ? " chip-active" : "")}
            onClick={() => applyFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="empty">Đang tải…</div>
        ) : items.length === 0 ? (
          <div className="empty">
            Chưa có bài viết nào. {canWrite && "Bấm “Viết bài mới” để bắt đầu."}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "right" }}>Lượt xem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const st = STATUS_META[p.status as PostStatus];
                return (
                  <tr
                    key={p.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/posts/${p.id}`)}
                  >
                    <td>
                      <strong>{p.title}</strong>
                      <div className="slug">/{p.slug}</div>
                    </td>
                    <td style={{ color: "var(--text-soft)" }}>
                      {p.category.name}
                    </td>
                    <td>
                      <span className={"status-pill " + st.cls}>{st.label}</span>
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text-soft)" }}>
                      {p.view_count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
