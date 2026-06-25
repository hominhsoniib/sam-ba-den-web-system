"""Exception nghiệp vụ + handler chuẩn hóa response lỗi."""
from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Lỗi nghiệp vụ cơ sở. Map sang HTTP code + body chuẩn."""

    status_code: int = 400

    def __init__(self, code: str, message: str, details: dict | None = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundError(AppError):
    status_code = 404


class UnauthorizedError(AppError):
    status_code = 401


class ForbiddenError(AppError):
    status_code = 403


class ConflictError(AppError):
    status_code = 409


class ValidationError(AppError):
    status_code = 422


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "data": None,
            "meta": {},
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            },
        },
    )
