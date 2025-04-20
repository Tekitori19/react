Đây là các lệnh `docker compose` (lệnh mới, có khoảng trắng) để xem logs của các container đang chạy, rất hữu ích để debug:

1.  **Xem Logs của TẤT CẢ Services đang chạy (theo thời gian thực):**
    Mở terminal trong thư mục gốc (nơi chứa `docker-compose.yml`) và chạy:
    ```bash
    docker compose logs -f
    ```
    *   `-f` hoặc `--follow`: Hiển thị logs mới được tạo ra theo thời gian thực. Nhấn `Ctrl + C` để dừng theo dõi.
    *   Bạn sẽ thấy logs từ tất cả các services (`backend`, `frontend`, `mongo`, `mongo-express`) xen kẽ nhau, có tiền tố là tên service.

2.  **Xem Logs của MỘT Service Cụ thể (theo thời gian thực):**
    ```bash
    docker compose logs -f <tên_service>
    ```
    Thay `<tên_service>` bằng tên bạn đã đặt trong `docker-compose.yml` (ví dụ: `backend`, `frontend`, `mongo`).
    *   Xem logs backend:
        ```bash
        docker compose logs -f backend
        ```
    *   Xem logs frontend (Nginx):
        ```bash
        docker compose logs -f frontend
        ```
    *   Xem logs MongoDB:
        ```bash
        docker compose logs -f mongo
        ```
    *   Xem logs Mongo Express:
        ```bash
        docker compose logs -f mongo-express
        ```

3.  **Xem Logs cũ hơn (không theo dõi thời gian thực):**
    Bỏ tùy chọn `-f` đi:
    ```bash
    docker compose logs <tên_service> # Xem toàn bộ log đã lưu của service
    docker compose logs                   # Xem toàn bộ log đã lưu của tất cả services
    ```

4.  **Xem Logs với Số dòng giới hạn:**
    Sử dụng tùy chọn `--tail`:
    ```bash
    docker compose logs --tail=50 backend # Hiển thị 50 dòng log cuối cùng của backend
    ```

5.  **Xem Logs với Dấu thời gian:**
    Thêm tùy chọn `-t` hoặc `--timestamps`:
    ```bash
    docker compose logs -f -t backend # Hiển thị logs backend với timestamp ở đầu mỗi dòng
    ```

**Khi nào dùng lệnh nào?**

*   **`docker compose logs -f`:** Khi bạn muốn xem mọi thứ xảy ra trên toàn bộ hệ thống ngay lập tức, ví dụ khi khởi động hoặc khi test một luồng liên quan đến nhiều service.
*   **`docker compose logs -f <tên_service>`:** Rất hữu ích khi debug một service cụ thể. Ví dụ, khi frontend báo lỗi API, bạn chạy `docker compose logs -f backend` để xem chính xác backend nhận được gì và xử lý như thế nào. Khi frontend không load được, chạy `docker compose logs -f frontend` để xem log Nginx.
*   **`docker compose logs --tail=N <tên_service>`:** Khi bạn chỉ cần xem những gì xảy ra gần đây nhất trong một service.

Hãy chạy các lệnh này để kiểm tra output của các container, đặc biệt là `backend` và `frontend`, để tìm ra nguyên nhân lỗi nhé!
