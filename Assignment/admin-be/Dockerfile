# backend/Dockerfile

# Sử dụng image Node.js phiên bản 18 (Alpine là bản nhẹ)
# Đặt tên stage là 'builder' để dùng cho multi-stage build
FROM node:18-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app/backend

# Sao chép file quản lý dependencies trước để tận dụng cache
COPY package.json pnpm-lock.yaml ./

# --- THÊM BƯỚC CÀI ĐẶT PNPM ---
# Cài đặt pnpm toàn cục sử dụng npm (có sẵn trong image node)
# Dùng --no-optional nếu không cần và để cài nhanh hơn
RUN npm install -g pnpm --no-optional
# -------------------------------

# Chạy pnpm install với cache mount (BuildKit)
# Chỉ cài dependencies cho production trong stage này
# Lệnh này sẽ dùng pnpm vừa cài ở bước trên
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --prod

# Sao chép toàn bộ mã nguồn còn lại của backend vào thư mục làm việc
COPY . .

# --- Stage Production - Image cuối cùng ---
FROM node:18-alpine

# Thiết lập thư mục làm việc (nên giống stage trước)
WORKDIR /usr/src/app/backend

# Sao chép node_modules đã được cài ở stage 'builder'
COPY --from=builder /usr/src/app/backend/node_modules ./node_modules
# Sao chép mã nguồn ứng dụng từ stage 'builder'
COPY --from=builder /usr/src/app/backend .

# Expose port mà ứng dụng lắng nghe (lấy từ biến môi trường nếu có, hoặc mặc định 5000)
# Giá trị PORT này sẽ được truyền vào từ docker-compose.yml
# Chúng ta không cần khai báo EXPOSE ở đây nếu dùng docker-compose để map port,
# nhưng để lại cũng không sao, nó có tính chất tài liệu.
# EXPOSE ${PORT:-5000} # Dùng PORT từ env hoặc mặc định 5000

# Lệnh để chạy ứng dụng khi container khởi động
CMD ["node", "server.js"]
