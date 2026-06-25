# Stage 1: Build ứng dụng React với Vite
FROM node:20-alpine as builder

WORKDIR /app

# Copy các tệp khai báo môi trường
COPY package.json package-lock.json ./
RUN npm ci

# Copy toàn bộ mã nguồn
COPY . .

# Build Vite application
ARG VITE_API_URL="http://localhost:8000"
ARG VITE_API_BASE_URL="http://localhost:8000/api/v1"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Serve tĩnh bằng Nginx
FROM nginx:alpine

# Xóa trang html mặc định của nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy kết quả build từ stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy cấu hình nginx tùy chỉnh (cho phép React Router hoạt động)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
