FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Cài đặt các công cụ hệ thống cần thiết
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt thư viện qua requirements
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy toàn bộ mã nguồn
COPY . .

# Chạy ở cổng 8000
EXPOSE 8000

# Chạy seed dữ liệu (nếu có) và khởi động API server
CMD ["sh", "-c", "python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
