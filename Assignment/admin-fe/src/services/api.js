// src/services/api.js
import axios from 'axios';

// Lấy URL API từ biến môi trường hoặc dùng mặc định
export const API_BASE_URL = 'http://localhost:5000/api';
export const LS_AUTH_TOKEN_KEY = 'dashboard_auth_token'; // Key lưu token trong localStorage
export const LS_USER_INFO_KEY = 'dashboard_user_info'; // Key lưu thông tin user

// Tạo một instance của Axios với cấu hình cơ bản
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Thiết lập interceptor để tự động đính kèm token vào header của mỗi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(LS_AUTH_TOKEN_KEY); // Lấy token từ localStorage
        if (token) {
            // Nếu có token, thêm vào header Authorization
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Trả về config đã được cập nhật
    },
    (error) => {
        // Xử lý lỗi request (ví dụ: network error)
        return Promise.reject(error);
    }
);

// (Optional) Thêm interceptor cho response để xử lý lỗi chung (vd: 401 Unauthorized)
// api.interceptors.response.use(
//     (response) => response, // Trả về response nếu thành công
//     (error) => {
//         if (error.response && error.response.status === 401) {
//             // Xử lý khi token hết hạn hoặc không hợp lệ
//             // Ví dụ: xóa token cũ, redirect về trang login
//             console.error('Unauthorized! Redirecting to login...');
//             localStorage.removeItem(LS_AUTH_TOKEN_KEY);
//             localStorage.removeItem(LS_USER_INFO_KEY);
//             // Cần cách để trigger reload hoặc navigate trong React context
//             // window.location.href = '/login'; // Cách đơn giản nhất nhưng làm full page reload
//         }
//         return Promise.reject(error); // Chuyển tiếp lỗi để component gọi xử lý
//     }
// );


export default api; // Export instance đã cấu hình
