"""
Vercel entrypoint shim.

Vercel's zero-config Python detection only looks for app.py / index.py /
server.py / main.py / wsgi.py / asgi.py directly at the project root or
one level deep under src/, app/, or api/ — not two levels deep at
backend/app/main.py, which is where this project's real FastAPI app lives.

This file just adds backend/ to sys.path and re-exports the real `app`
object, so Vercel finds a valid entrypoint here without moving or
duplicating any real source code.
"""
import os
import sys

_BACKEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app.main import app  # noqa: E402,F401
