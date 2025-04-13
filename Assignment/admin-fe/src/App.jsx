// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth'; // Import hook vừa tạo
import DashboardLayout from './components/layout/DashboardLayout'; // Sẽ tạo ở bước sau
import ProtectedRoute from './components/layout/ProtectedRoute';   // Sẽ tạo ở bước sau
import LoginPage from './pages/LoginPage';                       // Sẽ tạo ở bước sau
import DashboardHomePage from './pages/DashboardHomePage';       // Sẽ tạo ở bước sau
import ProductsPage from './pages/ProductsPage';               // Sẽ tạo ở bước sau
import OrdersPage from './pages/OrdersPage';                   // Sẽ tạo ở bước sau
import UsersPage from './pages/UsersPage';                     // Sẽ tạo ở bước sau
import StaffPage from './pages/StaffPage';                     // Sẽ tạo ở bước sau
import NotFoundPage from './pages/NotFoundPage';                 // Sẽ tạo ở bước sau
import LoadingSpinner from './components/common/LoadingSpinner'; // Sẽ tạo ở bước sau

function App() {
    // Sử dụng hook useAuth để lấy trạng thái xác thực
    const { authToken, userInfo, login, logout, isAuthenticating } = useAuth();

    // Hiển thị màn hình loading toàn trang trong khi đang kiểm tra token
    if (isAuthenticating) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                {/* Sử dụng component LoadingSpinner */}
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-500">Đang tải ứng dụng...</span>
            </div>
        );
    }

    // Thiết lập cấu trúc Routes
    return (
        <Router>
            <Routes>
                {/* Route cho trang Đăng nhập */}
                <Route
                    path="/login"
                    element={
                        // Nếu chưa đăng nhập (không có token), hiển thị trang Login
                        !authToken
                            ? <LoginPage onLoginSuccess={login} /> // Truyền hàm login từ useAuth vào
                            // Nếu đã đăng nhập, chuyển hướng về trang chủ Dashboard
                            : <Navigate to="/" replace />
                    }
                />

                {/* Route cho Layout chính của Dashboard */}
                <Route
                    path="/"
                    element={
                        // Sử dụng ProtectedRoute để kiểm tra đăng nhập trước khi vào Dashboard
                        <ProtectedRoute isLoggedIn={!!authToken}>
                            {/* Nếu đã đăng nhập, hiển thị DashboardLayout */}
                            <DashboardLayout userInfo={userInfo} onLogout={logout} />
                        </ProtectedRoute>
                    }
                >
                    {/* Các route con bên trong DashboardLayout, sẽ render vào <Outlet> */}
                    {/* index=true nghĩa là route mặc định khi vào "/" */}
                    <Route index element={<DashboardHomePage />} />
                    <Route path="products" element={<ProductsPage userInfo={userInfo} />} />
                    <Route path="orders" element={<OrdersPage userInfo={userInfo} />} />
                    <Route path="users" element={<UsersPage userInfo={userInfo} />} />

                    {/* Route này chỉ render nếu user là admin */}
                    {userInfo?.role === 'admin' && (
                        <Route path="staff" element={<StaffPage userInfo={userInfo} />} />
                    )}

                    {/* Route bắt các đường dẫn không khớp bên trong dashboard */}
                    <Route path="*" element={<NotFoundPage insideDashboard={true} />} />
                </Route>

                {/* Route bắt các đường dẫn không khớp ở cấp cao nhất */}
                <Route path="*" element={<NotFoundPage />} />

            </Routes>
        </Router>
    );
}

export default App;
