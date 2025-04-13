// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Dùng axios gốc vì api instance có thể bị race condition khi khởi tạo
import { API_BASE_URL, LS_AUTH_TOKEN_KEY, LS_USER_INFO_KEY } from '../services/api';

function useAuth() {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem(LS_AUTH_TOKEN_KEY));
    const [userInfo, setUserInfo] = useState(() => {
        const storedUser = localStorage.getItem(LS_USER_INFO_KEY);
        try { return storedUser ? JSON.parse(storedUser) : null; } catch { return null; }
    });
    const [isAuthenticating, setIsAuthenticating] = useState(true); // Ban đầu đang kiểm tra

    // Hàm kiểm tra token khi component mount hoặc token thay đổi
    useEffect(() => {
        let isMounted = true; // Biến cờ để tránh cập nhật state khi component unmount
        const verifyToken = async () => {
            setIsAuthenticating(true); // Bắt đầu kiểm tra
            const token = localStorage.getItem(LS_AUTH_TOKEN_KEY); // Lấy token hiện tại

            if (!token) {
                // Nếu không có token, ngừng kiểm tra, đảm bảo đã logout
                if (isMounted) {
                    setIsAuthenticating(false);
                    setAuthToken(null);
                    setUserInfo(null);
                }
                return;
            }

            try {
                // Dùng axios gốc để gọi API /me kiểm tra token
                const headers = { Authorization: `Bearer ${token}` };
                const { data } = await axios.get(`${API_BASE_URL}/auth/me`, { headers });

                // Nếu thành công và component vẫn còn mount
                if (isMounted) {
                    setUserInfo(data);
                    setAuthToken(token); // Đảm bảo state token đúng
                    localStorage.setItem(LS_USER_INFO_KEY, JSON.stringify(data)); // Cập nhật user info mới nhất vào LS
                }
            } catch (err) {
                // Nếu token không hợp lệ (401) hoặc có lỗi khác
                console.error("Token validation failed on mount:", err.response?.data?.message || err.message);
                if (isMounted) {
                    // Xóa thông tin cũ đi
                    localStorage.removeItem(LS_AUTH_TOKEN_KEY);
                    localStorage.removeItem(LS_USER_INFO_KEY);
                    setAuthToken(null);
                    setUserInfo(null);
                }
            } finally {
                // Dù thành công hay lỗi, cuối cùng cũng ngừng trạng thái "đang kiểm tra"
                if (isMounted) {
                    setIsAuthenticating(false);
                }
            }
        };

        verifyToken();

        // Cleanup function: đặt isMounted = false khi component unmount
        return () => {
            isMounted = false;
        };
    }, []); // Chỉ chạy 1 lần khi hook được mount

    // Hàm thực hiện đăng nhập
    const login = useCallback((token, userData) => {
        localStorage.setItem(LS_AUTH_TOKEN_KEY, token);
        localStorage.setItem(LS_USER_INFO_KEY, JSON.stringify(userData));
        setAuthToken(token);
        setUserInfo(userData);
    }, []); // Hàm này không thay đổi

    // Hàm thực hiện đăng xuất
    const logout = useCallback(() => {
        localStorage.removeItem(LS_AUTH_TOKEN_KEY);
        localStorage.removeItem(LS_USER_INFO_KEY);
        setAuthToken(null);
        setUserInfo(null);
        // Có thể thêm logic khác ở đây nếu cần (vd: redirect)
    }, []); // Hàm này không thay đổi

    // Trả về các state và hàm cần thiết cho component sử dụng hook
    return { authToken, userInfo, login, logout, isAuthenticating };
}

export default useAuth;
