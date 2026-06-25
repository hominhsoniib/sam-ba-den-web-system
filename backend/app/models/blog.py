"""Models Blog SEO (M3): BlogCategory, BlogPost, Tag + bảng nối post_tags.

Ghi chú: vòng này dùng cover_image_url (chuỗi URL) thay vì FK tới media_files
để lát cắt chạy độc lập, chưa phụ thuộc module Media (M2). Khi M2 xong sẽ
nâng cấp sang FK — không phá vỡ API public.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    Column,
    ForeignKey,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("blog_posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class BlogCategory(Base):
    __tablename__ = "blog_categories"

    name: Mapped[str] = mapped_column(String(150))
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)

    posts: Mapped[list[BlogPost]] = relationship(back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)

    posts: Mapped[list[BlogPost]] = relationship(
        secondary=post_tags, back_populates="tags"
    )


class BlogPost(Base):
    __tablename__ = "blog_posts"

    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(280), unique=True, index=True)
    excerpt: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("blog_categories.id"), index=True
    )
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), index=True)

    # draft -> review -> published -> archived
    status: Mapped[str] = mapped_column(String(20), default="draft", index=True)

    # SEO
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    seo_keywords: Mapped[str | None] = mapped_column(String(500), nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    og_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    og_description: Mapped[str | None] = mapped_column(String(320), nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meta_robots: Mapped[str] = mapped_column(String(50), default="index,follow")

    # Tuân thủ quảng cáo TPCN
    disclaimer: Mapped[str | None] = mapped_column(Text, nullable=True)

    published_at: Mapped[datetime | None] = mapped_column(nullable=True, index=True)
    view_count: Mapped[int] = mapped_column(BigInteger, default=0)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    category: Mapped[BlogCategory] = relationship(
        back_populates="posts", lazy="selectin"
    )
    author: Mapped[User] = relationship(lazy="selectin")  # noqa: F821
    tags: Mapped[list[Tag]] = relationship(
        secondary=post_tags, back_populates="posts", lazy="selectin"
    )
