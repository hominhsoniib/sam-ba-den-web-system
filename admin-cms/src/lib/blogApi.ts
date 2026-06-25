import { api } from "./api";
import type {
  ApiResponse,
  Category,
  PostDetail,
  PostListItem,
  PostStatus,
} from "./types";

export interface PostPayload {
  title: string;
  content: string;
  excerpt?: string;
  category_id: string;
  cover_image_url?: string;
  tag_names?: string[];
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  meta_robots?: string;
  disclaimer?: string;
}

export const blogApi = {
  async listCategories() {
    const r = await api.get<ApiResponse<Category[]>>("/admin/blog/categories");
    return r.data.data ?? [];
  },
  async createCategory(name: string) {
    const r = await api.post<ApiResponse<Category>>("/admin/blog/categories", {
      name,
    });
    return r.data.data!;
  },
  async listPosts(status?: string) {
    const r = await api.get<ApiResponse<PostListItem[]>>("/admin/blog/posts", {
      params: status ? { status } : {},
    });
    return { items: r.data.data ?? [], meta: r.data.meta };
  },
  async getPost(id: string) {
    const r = await api.get<ApiResponse<PostDetail>>(`/admin/blog/posts/${id}`);
    return r.data.data!;
  },
  async createPost(payload: PostPayload) {
    const r = await api.post<ApiResponse<PostDetail>>(
      "/admin/blog/posts",
      payload,
    );
    return r.data.data!;
  },
  async updatePost(id: string, payload: Partial<PostPayload>) {
    const r = await api.put<ApiResponse<PostDetail>>(
      `/admin/blog/posts/${id}`,
      payload,
    );
    return r.data.data!;
  },
  async changeStatus(id: string, action: string) {
    const r = await api.patch<ApiResponse<PostDetail>>(
      `/admin/blog/posts/${id}/status`,
      { action },
    );
    return r.data.data!;
  },
  async remove(id: string) {
    await api.delete(`/admin/blog/posts/${id}`);
  },
};

// Nhãn + màu trạng thái dùng chung
export const STATUS_META: Record<
  PostStatus,
  { label: string; cls: string }
> = {
  draft: { label: "Bản nháp", cls: "st-draft" },
  review: { label: "Chờ duyệt", cls: "st-review" },
  published: { label: "Đã xuất bản", cls: "st-published" },
  archived: { label: "Lưu trữ", cls: "st-archived" },
};
