"""Sinh JSON-LD (schema.org) cho bài viết — phục vụ SEO."""
from typing import Any


def build_article_json_ld(
    *,
    title: str,
    description: str | None,
    url: str,
    image_url: str | None,
    author_name: str,
    published_at: str | None,
    updated_at: str | None,
    category_name: str | None,
) -> dict[str, Any]:
    """Trả về dict JSON-LD kiểu Article (kèm publisher Organization)."""
    data: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "author": {"@type": "Person", "name": author_name},
        "publisher": {
            "@type": "Organization",
            "name": "Sâm Bà Đen",
        },
    }
    if description:
        data["description"] = description
    if image_url:
        data["image"] = image_url
    if published_at:
        data["datePublished"] = published_at
    if updated_at:
        data["dateModified"] = updated_at
    if category_name:
        data["articleSection"] = category_name
    return data


def build_breadcrumb_json_ld(items: list[tuple[str, str]]) -> dict[str, Any]:
    """items = [(tên, url), ...] theo thứ tự breadcrumb."""
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": name,
                "item": url,
            }
            for i, (name, url) in enumerate(items)
        ],
    }
