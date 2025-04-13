// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios'; // Sử dụng axios gốc vì chưa có interceptor lúc này
import { API_BASE_URL } from '../services/api'; // Import URL API
import LoginForm from '../components/auth/LoginForm'; // Import component form
import LoadingSpinner from '../components/common/LoadingSpinner'; // Import spinner

// Props: onLoginSuccess là hàm callback từ App.js để cập nhật trạng thái Auth
function LoginPage({ onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Hàm xử lý khi form đăng nhập được submit
    const handleLogin = async (username, password) => {
        setLoading(true); // Bắt đầu loading
        setError(''); // Xóa lỗi cũ
        try {
            // Gọi API đăng nhập
            const { data } = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
            // Nếu thành công, gọi callback để cập nhật state trong App/useAuth
            onLoginSuccess(data.token, data); // data chứa token và user info

            // Lấy đường dẫn trang trước đó người dùng muốn vào (nếu có) hoặc về trang chủ
            const from = location.state?.from || '/';
            navigate(from, { replace: true }); // Chuyển hướng, replace=true để không lưu trang login vào history
        } catch (err) {
            console.error('Login failed:', err.response?.data?.message || err.message);
            // Hiển thị lỗi cho người dùng
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập hoặc mật khẩu.');
        } finally {
            setLoading(false); // Kết thúc loading dù thành công hay thất bại
        }
    };

    // Render giao diện trang Login
    return (
        // Dùng Tailwind để tạo layout toàn màn hình, nền gradient và căn giữa nội dung
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-xl transform transition-all hover:shadow-2xl">
                {/* Phần tiêu đề */}
                <div>
                    {/* Bạn có thể thêm logo ở đây */}
                    {/* <img className="mx-auto h-12 w-auto" src="/path/to/logo.svg" alt="Workflow"/> */}
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                        Đăng nhập Dashboard
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Quản lý cửa hàng của bạn
                    </p>
                </div>

                {/* Hiển thị lỗi nếu có (trước form) */}
                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.257 7.303a.75.75 0 00-1.06 1.06L8.94 10l-1.743 1.637a.75.75 0 101.06 1.06L10 11.06l1.743 1.637a.75.75 0 101.06-1.06L11.06 10l1.743-1.637a.75.75 0 10-1.06-1.06L10 8.94 8.257 7.303z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Component LoginForm sẽ xử lý các input và nút submit */}
                <LoginForm onLogin={handleLogin} loading={loading} />

            </div>
        </div>
    );
}

export default LoginPage;
