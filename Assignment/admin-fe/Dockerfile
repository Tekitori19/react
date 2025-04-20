# frontend/Dockerfile

# ----- Stage 1: Build React App -----
# Đặt tên stage này là 'builder'
FROM node:18-alpine AS builder

# Thư mục làm việc trong container
WORKDIR /app

# Copy file quản lý dependencies trước
COPY package.json pnpm-lock.yaml ./

# --- THÊM BƯỚC CÀI ĐẶT PNPM ---
# Cài pnpm toàn cục bằng npm (có sẵn trong image node)
RUN npm install -g pnpm --no-optional
# -------------------------------

# Cài đặt toàn bộ dependencies (bao gồm cả devDependencies để build)
# Dùng cache mount nếu dùng BuildKit
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

# Sao chép toàn bộ mã nguồn frontend vào container
COPY . .

# Nhận biến môi trường build-time từ docker-compose args
ARG REACT_APP_API_URL
# Đặt biến môi trường ENV để quá trình build có thể sử dụng
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build ứng dụng React cho production
RUN pnpm build

# THÊM DÒNG NÀY ĐỂ DEBUG
RUN ls -la /app

# ----- Stage 2: Serve with Nginx -----
FROM nginx:stable-alpine

# Sao chép thư mục build tĩnh từ stage builder vào thư mục phục vụ web của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Xóa file cấu hình Nginx mặc định
RUN rm /etc/nginx/conf.d/default.conf

# Sao chép file cấu hình Nginx tùy chỉnh từ thư mục nginx của dự án
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (cổng mặc định Nginx)
EXPOSE 80

# Lệnh để khởi động Nginx ở foreground
CMD ["nginx", "-g", "daemon off;"]
