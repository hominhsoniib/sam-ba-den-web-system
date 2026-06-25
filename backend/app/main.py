"""Điểm vào ứng dụng FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.admin import analytics as admin_analytics
from app.api.v1.admin import blog as admin_blog
from app.api.v1.admin import contact as admin_contact
from app.api.v1.admin import product as admin_product
from app.api.v1.admin import users as admin_users
from app.api.v1.admin import crm as admin_crm
from app.api.v1.admin import dealers as admin_dealers
from app.api.v1.admin import orders as admin_orders
from app.api.v1.admin import qrcode as admin_qrcode
from app.api.v1.auth.router import router as auth_router
from app.api.v1.public import blog as public_blog
from app.api.v1.public import contact as public_contact
from app.api.v1.public import product as public_product
from app.api.v1.public import qrcode as public_qrcode
from app.api.v1.public.router import router as public_router
from app.api.v1.portal.router import router as portal_router
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/docs",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
)

app.add_middleware(CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)
# Serve static assets
app.mount("/files", StaticFiles(directory=settings.files_dir), name="files")
app.mount("/public", StaticFiles(directory="d:/App_Claude_Antigravity/Web_Landipage/web-public"), name="public")
app.mount("/landing", StaticFiles(directory=settings.landing_dir), name="landing")

app.add_exception_handler(AppError, app_error_handler)

# Routers
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(admin_analytics.router, prefix=settings.api_v1_prefix)
app.include_router(admin_users.router, prefix=settings.api_v1_prefix)
app.include_router(admin_blog.router, prefix=settings.api_v1_prefix)
app.include_router(admin_product.router, prefix=settings.api_v1_prefix)
app.include_router(admin_contact.router, prefix=settings.api_v1_prefix)
app.include_router(admin_crm.router, prefix=settings.api_v1_prefix)
app.include_router(admin_dealers.router, prefix=settings.api_v1_prefix)
app.include_router(admin_orders.router, prefix=settings.api_v1_prefix)
app.include_router(admin_qrcode.router, prefix=settings.api_v1_prefix)
app.include_router(public_router, prefix=settings.api_v1_prefix)
app.include_router(public_blog.router, prefix=settings.api_v1_prefix)
app.include_router(public_product.router, prefix=settings.api_v1_prefix)
app.include_router(public_contact.router, prefix=settings.api_v1_prefix)
app.include_router(public_qrcode.router, prefix=settings.api_v1_prefix)
app.include_router(portal_router, prefix=f"{settings.api_v1_prefix}/portal")
app.include_router(public_blog.root_router)  # /sitemap.xml, /robots.txt ở root


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "env": settings.env}
