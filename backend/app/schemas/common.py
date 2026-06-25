"""Wrapper response chuẩn: {data, meta, error}."""
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T | None = None
    meta: dict = {}
    error: dict | None = None


class PageMeta(BaseModel):
    total: int
    page: int
    page_size: int
