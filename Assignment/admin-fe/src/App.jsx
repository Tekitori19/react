import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    TimeScale, // Import TimeScale for time-based charts
    Filler // For filled line charts if needed
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Adapter cho trục thời gian
import './App.css'; // CSS file (nội dung ở dưới)

// --- Đăng ký các thành phần Chart.js ---
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    TimeScale, // Register TimeScale
    Filler
);

// --- Cấu hình ---
const API_BASE_URL = 'http://localhost:5000/api'; // Địa chỉ API Backend
const LS_AUTH_TOKEN_KEY = 'dashboard_auth_token';
const LS_USER_INFO_KEY = 'dashboard_user_info';

// --- Axios Instance (tự động thêm token) ---
const api = axios.create({
    baseURL: API_BASE_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem(LS_AUTH_TOKEN_KEY);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// --- Hook kiểm tra Auth và lấy User Info ---
function useAuth() {
    const [authToken, setAuthToken] = useState(() => localStorage.getItem(LS_AUTH_TOKEN_KEY));
    const [userInfo, setUserInfo] = useState(() => {
        const storedUser = localStorage.getItem(LS_USER_INFO_KEY);
        try { return storedUser ? JSON.parse(storedUser) : null; } catch { return null; }
    });
    const [isAuthenticating, setIsAuthenticating] = useState(true); // Bắt đầu là đang kiểm tra

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem(LS_AUTH_TOKEN_KEY);
            if (!token) {
                setIsAuthenticating(false);
                setAuthToken(null);
                setUserInfo(null);
                return;
            }
            try {
                // Tự tạo interceptor tạm thời ở đây vì hook có thể chạy trước khi interceptor toàn cục sẵn sàng
                const headers = { Authorization: `Bearer ${token}` };
                const { data } = await axios.get(`${API_BASE_URL}/auth/me`, { headers });
                setUserInfo(data);
                setAuthToken(token); // Đảm bảo state đồng bộ
                localStorage.setItem(LS_USER_INFO_KEY, JSON.stringify(data)); // Cập nhật LS
            } catch (err) {
                console.error("Token validation failed on mount:", err);
                localStorage.removeItem(LS_AUTH_TOKEN_KEY);
                localStorage.removeItem(LS_USER_INFO_KEY);
                setAuthToken(null);
                setUserInfo(null);
            } finally {
                setIsAuthenticating(false);
            }
        };
        verifyToken();
    }, []);

    const login = useCallback((token, userData) => {
        localStorage.setItem(LS_AUTH_TOKEN_KEY, token);
        localStorage.setItem(LS_USER_INFO_KEY, JSON.stringify(userData));
        setAuthToken(token);
        setUserInfo(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(LS_AUTH_TOKEN_KEY);
        localStorage.removeItem(LS_USER_INFO_KEY);
        setAuthToken(null);
        setUserInfo(null);
    }, []);

    return { authToken, userInfo, login, logout, isAuthenticating };
}


// --- Component Chính: App ---
function App() {
    const auth = useAuth();

    if (auth.isAuthenticating) {
        return <div className="loading-fullscreen">Đang kiểm tra xác thực...</div>;
    }

    return (
        <Router>
            <Routes>
                {/* Route cho trang Login */}
                <Route path="/login" element={
                    !auth.authToken ? <LoginPage onLoginSuccess={auth.login} /> : <Navigate to="/" replace />
                } />

                {/* Route chính của Dashboard (bảo vệ) */}
                <Route path="/*" element={
                    <ProtectedRoute isLoggedIn={!!auth.authToken}>
                        <DashboardLayout userInfo={auth.userInfo} onLogout={auth.logout} />
                    </ProtectedRoute>
                } />
                {/* Route mặc định nếu không khớp */}
                <Route path="*" element={<Navigate to={auth.authToken ? "/" : "/login"} replace />} />

            </Routes>
        </Router>
    );
}

// --- Component Bảo vệ Route ---
function ProtectedRoute({ isLoggedIn, children }) {
    if (!isLoggedIn) {
        // Redirect đến trang login, lưu lại trang định đến (optional)
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }
    return children; // Render component con nếu đã đăng nhập
}

// --- Component Layout Dashboard ---
function DashboardLayout({ userInfo, onLogout }) {
    const location = useLocation(); // Để biết đang ở path nào

    // Hàm kiểm tra active link
    const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

    return (
        <div className="dashboard-layout">
            <header className="dashboard-header">
                <h1>Dashboard Shop</h1>
                {userInfo && (
                    <div className="user-info">
                        <span>Chào, <strong>{userInfo.full_name || userInfo.username}</strong> ({userInfo.role})</span>
                        <button onClick={onLogout} className="btn-logout">Đăng xuất</button>
                    </div>
                )}
            </header>
            <div className="dashboard-main">
                <nav className="dashboard-sidebar">
                    <ul>
                        {/* Link thay cho button */}
                        <li><Link to="/" className={isActive('/') ? 'active' : ''}>📊 Tổng quan</Link></li>
                        <li><Link to="/products" className={isActive('/products') ? 'active' : ''}>📦 Sản phẩm</Link></li>
                        <li><Link to="/orders" className={isActive('/orders') ? 'active' : ''}>🛒 Đơn hàng</Link></li>
                        <li><Link to="/users" className={isActive('/users') ? 'active' : ''}>👥 Khách hàng</Link></li>
                        {userInfo?.role === 'admin' && (
                            <li><Link to="/staff" className={isActive('/staff') ? 'active' : ''}>🧑‍💼 Nhân viên</Link></li>
                        )}
                    </ul>
                </nav>
                <main className="dashboard-content-area">
                    {/* Outlet sẽ render component tương ứng với route con */}
                    <Routes>
                        <Route index element={<DashboardHomePage />} /> {/* Trang chủ mặc định */}
                        <Route path="products" element={<ProductsPage userInfo={userInfo} />} />
                        <Route path="orders" element={<OrdersPage userInfo={userInfo} />} />
                        <Route path="users" element={<UsersPage userInfo={userInfo} />} />
                        {userInfo?.role === 'admin' && (
                            <Route path="staff" element={<StaffPage userInfo={userInfo} />} />
                        )}
                        {/* Route bắt lỗi 404 trong dashboard */}
                        <Route path="*" element={<h2>404 - Trang không tồn tại trong Dashboard</h2>} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}


// --- Trang Login ---
function LoginPage({ onLoginSuccess }) {
    // Bỏ state username/password ở đây vì LoginForm sẽ quản lý
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Sửa hàm handleLogin để nhận username/password từ LoginForm
    const handleLogin = async (username, password) => { // Nhận trực tiếp username, password
        setLoading(true);
        setError('');
        try {
            // Gửi đúng username, password nhận được
            const { data } = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
            onLoginSuccess(data.token, data);
            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        } catch (err) {
            console.error('Login failed:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Truyền hàm handleLogin đã được sửa đổi vào LoginForm */}
            <LoginForm onLogin={handleLogin} loading={loading} error={error} />
        </div>
    );
}


// --- Trang Tổng quan (Charts) ---
function DashboardHomePage() {
    const [orderStatusData, setOrderStatusData] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError('');
            try {
                const [statusRes, revenueRes, stockRes] = await Promise.all([
                    api.get('/dashboard/stats/order-status').catch(e => { console.error("Error fetching order status:", e); return { data: [] }; }), // Tránh lỗi Promise.all
                    api.get('/dashboard/stats/revenue-orders-daily').catch(e => { console.error("Error fetching revenue:", e); return { data: [] }; }),
                    api.get('/dashboard/stats/product-stock').catch(e => { console.error("Error fetching stock:", e); return { data: { low: 0, medium: 0, high: 0 } }; }),
                ]);

                // Process Order Status Data for Doughnut Chart
                if (statusRes.data.length > 0) {
                    setOrderStatusData({
                        labels: statusRes.data.map(item => item.status),
                        datasets: [{
                            label: 'Số lượng đơn hàng',
                            data: statusRes.data.map(item => item.count),
                            backgroundColor: [
                                'rgba(255, 159, 64, 0.7)', // Pending (Orange)
                                'rgba(54, 162, 235, 0.7)', // Processing (Blue)
                                'rgba(153, 102, 255, 0.7)',// Shipped (Purple)
                                'rgba(75, 192, 192, 0.7)', // Delivered (Green)
                                'rgba(201, 203, 207, 0.7)',// Cancelled (Grey)
                                'rgba(255, 99, 132, 0.7)'  // Failed (Red)
                            ],
                            borderColor: '#fff',
                            borderWidth: 1,
                        }]
                    });
                } else { setOrderStatusData(null); }


                // Process Revenue/Orders Data for Line Chart
                if (revenueRes.data.length > 0) {
                    setRevenueData({
                        labels: revenueRes.data.map(item => item.date),
                        datasets: [
                            {
                                label: 'Doanh thu (VND)',
                                data: revenueRes.data.map(item => item.revenue),
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                yAxisID: 'yRevenue',
                                tension: 0.1,
                                // fill: true
                            },
                            {
                                label: 'Số đơn hàng thành công',
                                data: revenueRes.data.map(item => item.orders),
                                borderColor: 'rgb(255, 99, 132)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                yAxisID: 'yOrders',
                                tension: 0.1
                            }
                        ]
                    });
                } else { setRevenueData(null); }

                // Process Stock Data for Bar Chart
                if (stockRes.data) {
                    setStockData({
                        labels: ['Thấp (<10)', 'Trung bình (10-49)', 'Cao (>=50)'],
                        datasets: [{
                            label: 'Số lượng sản phẩm theo tồn kho',
                            data: [stockRes.data.low, stockRes.data.medium, stockRes.data.high],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)', // Low (Red)
                                'rgba(255, 206, 86, 0.7)', // Medium (Yellow)
                                'rgba(75, 192, 192, 0.7)',  // High (Green)
                            ],
                            borderColor: [
                                'rgb(255, 99, 132)',
                                'rgb(255, 206, 86)',
                                'rgb(75, 192, 192)',
                            ],
                            borderWidth: 1
                        }]
                    });
                } else { setStockData(null); }

            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
                setError('Không thể tải dữ liệu thống kê.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const lineChartOptions = useMemo(() => ({ // Dùng useMemo để tránh tạo lại options không cần thiết
        responsive: true,
        maintainAspectRatio: false, // Cho phép set height/width tùy ý hơn
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Doanh thu & Đơn hàng Thành công (30 ngày qua)' }
        },
        scales: {
            x: { type: 'time', time: { unit: 'day', tooltipFormat: 'dd/MM/yyyy' }, title: { display: true, text: 'Ngày' } },
            yRevenue: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Doanh thu (VND)' }, grid: { drawOnChartArea: false } }, // Grid chỉ cho trục chính
            yOrders: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Số đơn' }, ticks: { precision: 0 } } // Đảm bảo số đơn là số nguyên
        }
    }), []);

    const doughnutChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' }, title: { display: true, text: 'Phân bố Trạng thái Đơn hàng' } }
    }), []);

    const barChartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, text: 'Phân loại Tồn kho Sản phẩm' } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } // Bắt đầu trục Y từ 0, số nguyên
    }), []);


    if (loading) return <div className="loading-indicator">Đang tải thống kê...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="dashboard-home">
            <h2>Tổng quan</h2>
            <div className="charts-grid">
                {/* Line Chart */}
                <div className="chart-container chart-container-large">
                    {revenueData ? <Line options={lineChartOptions} data={revenueData} /> : <p>Không có dữ liệu doanh thu/đơn hàng.</p>}
                </div>
                {/* Doughnut Chart */}
                <div className="chart-container">
                    {orderStatusData ? <Doughnut options={doughnutChartOptions} data={orderStatusData} /> : <p>Không có dữ liệu trạng thái đơn hàng.</p>}
                </div>
                {/* Bar Chart */}
                <div className="chart-container">
                    {stockData ? <Bar options={barChartOptions} data={stockData} /> : <p>Không có dữ liệu tồn kho.</p>}
                </div>
                {/* Thêm các ô thống kê nhanh nếu muốn */}
            </div>
        </div>
    );
}


// --- Trang Sản phẩm ---
function ProductsPage({ userInfo }) {
    // Lấy state và logic từ App gốc (hoặc tạo hook riêng nếu tách file)
    const [productsData, setProductsData] = useState({ items: [], page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchData = useCallback(async (page = 1, params = {}) => {
        setLoading(true); setError('');
        try {
            const { data } = await api.get('/products', { params: { ...params, page } });
            setProductsData({
                items: data.products || [],
                page: data.page || 1,
                pages: data.pages || 1,
                total: data.total || 0
            });
        } catch (err) { setError(`Lỗi tải sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(1); }, [fetchData]);

    // Copy logic handlers (handleCreate, handleUpdate, handleDelete, openForm) từ App gốc vào đây
    const handleCreate = async (formData) => {
        setLoading(true); setError('');
        try { await api.post('/products', formData); setShowFormModal(false); fetchData(productsData.page); }
        catch (err) { setError(`Lỗi tạo sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const handleUpdate = async (id, formData) => {
        setLoading(true); setError('');
        try { await api.put(`/products/${id}`, formData); setShowFormModal(false); fetchData(productsData.page); }
        catch (err) { setError(`Lỗi cập nhật sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const handleDelete = async (id, itemName = "sản phẩm") => {
        if (!window.confirm(`Xóa ${itemName}?`)) return;
        setLoading(true); setError('');
        try { await api.delete(`/products/${id}`); fetchData(1); /* Quay về trang 1 sau khi xóa */ }
        catch (err) { setError(`Lỗi xóa sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const openForm = (item = null) => {
        setEditingItem(item);
        setShowFormModal(true);
        setError('');
    };

    return (
        <div>
            {loading && <div className="loading-indicator">Đang tải...</div>}
            {error && <div className="error-message">{error} <button onClick={() => setError('')}>Đóng</button></div>}
            {/* Reuse ProductsView component logic */}
            <ProductsView
                productsData={productsData}
                onEdit={openForm}
                onDelete={(id) => handleDelete(id)}
                onCreate={() => openForm(null)}
                isAdmin={userInfo?.role === 'admin'}
                fetchData={fetchData} // Cho phân trang
                currentPage={productsData.page}
            />
            {/* Reuse FormModal component logic */}
            {showFormModal && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    item={editingItem}
                    formType={'product'} // Hardcode type
                    onSubmit={editingItem ? (formData) => handleUpdate(editingItem._id, formData) : handleCreate}
                    loading={loading}
                />
            )}
        </div>
    );
}


// --- Trang Đơn hàng ---
function OrdersPage({ userInfo }) {
    const [ordersData, setOrdersData] = useState({ items: [], page: 1, pages: 1, total: 0 }); // Đổi tên và cấu trúc state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchData = useCallback(async (page = 1) => { // Thêm tham số page
        setLoading(true); setError('');
        try {
            // Gửi page trong params
            const { data } = await api.get('/orders', { params: { page } });
            // Cập nhật state với cấu trúc mới từ backend
            setOrdersData({
                items: data.orders || [], // Backend trả về key 'orders'
                page: data.page || 1,
                pages: data.pages || 1,
                total: data.total || 0
            });
        } catch (err) { setError(`Lỗi tải đơn hàng: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(1); }, [fetchData]); // Fetch trang 1 khi component mount

    const handleUpdate = async (id, formData) => {
        setLoading(true); setError('');
        try {
            await api.put(`/orders/${id}/status`, formData);
            setShowFormModal(false);
            fetchData(ordersData.page); // <-- Quan trọng: Fetch lại trang hiện tại
        } catch (err) { setError(`Lỗi cập nhật TT đơn hàng: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    const openForm = (item = null) => {
        setEditingItem(item); setShowFormModal(true); setError('');
    };

    // Hàm xử lý chuyển trang
    const handlePageChange = (newPage) => {
        fetchData(newPage);
    };

    return (
        <div>
            {loading && <div className="loading-indicator">Đang tải...</div>}
            {error && <div className="error-message">{error} <button onClick={() => setError('')}>Đóng</button></div>}
            {/* Truyền ordersData.items thay vì orders */}
            <OrdersView
                orders={ordersData.items}
                onEditStatus={openForm}
                totalOrders={ordersData.total} // Truyền tổng số đơn hàng (tuỳ chọn)
            />
            {/* Thêm Pagination */}
            <Pagination
                currentPage={ordersData.page}
                totalPages={ordersData.pages}
                onPageChange={handlePageChange}
            />
            {showFormModal && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    item={editingItem}
                    formType={'orderStatus'}
                    onSubmit={(formData) => handleUpdate(editingItem._id, formData)}
                    loading={loading}
                />
            )}
        </div>
    );
}


// --- Trang Khách hàng ---
function UsersPage({ userInfo }) {
    const [usersData, setUsersData] = useState({ items: [], page: 1, pages: 1, total: 0 }); // Đổi state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchData = useCallback(async (page = 1) => { // Thêm page
        setLoading(true); setError('');
        try {
            const { data } = await api.get('/users', { params: { page } }); // Gửi page
            setUsersData({ // Cập nhật state
                items: data.users || [], // Backend trả key 'users'
                page: data.page || 1,
                pages: data.pages || 1,
                total: data.total || 0
            });
        } catch (err) { setError(`Lỗi tải khách hàng: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchData(1); }, [fetchData]);

    const handleUpdate = async (id, formData) => {
        setLoading(true); setError('');
        try {
            await api.put(`/users/${id}/status`, formData);
            setShowFormModal(false);
            fetchData(usersData.page); // Fetch lại trang hiện tại
        } catch (err) { setError(`Lỗi cập nhật TT KH: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const handleDelete = async (id, itemName = "khách hàng") => {
        if (!window.confirm(`Xóa ${itemName}?`)) return;
        setLoading(true); setError('');
        try {
            await api.delete(`/users/${id}`);
            // Sau khi xóa, nên về trang 1 hoặc kiểm tra nếu trang hiện tại còn item ko
            // Đơn giản nhất là fetch lại trang hiện tại, nếu nó trống thì backend nên trả về trang cuối cùng có data (nếu backend xử lý)
            // Hoặc đơn giản là fetch lại trang 1
            fetchData(1);
            // Hoặc giữ lại trang hiện tại nếu số lượng chưa về 0
            // if(usersData.items.length === 1 && usersData.page > 1) {
            //    fetchData(usersData.page - 1);
            // } else {
            //    fetchData(usersData.page);
            // }

        } catch (err) { setError(`Lỗi xóa khách hàng: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const openForm = (item = null) => { setEditingItem(item); setShowFormModal(true); setError(''); };

    // Hàm xử lý chuyển trang
    const handlePageChange = (newPage) => {
        fetchData(newPage);
    };

    return (
        <div>
            {loading && <div className="loading-indicator">Đang tải...</div>}
            {error && <div className="error-message">{error} <button onClick={() => setError('')}>Đóng</button></div>}
            <UsersView
                users={usersData.items} // Truyền items
                onEditStatus={openForm}
                onDelete={(id) => handleDelete(id)}
                isAdmin={userInfo?.role === 'admin'}
                totalUsers={usersData.total} // Truyền total (tuỳ chọn)
            />
            {/* Thêm Pagination */}
            <Pagination
                currentPage={usersData.page}
                totalPages={usersData.pages}
                onPageChange={handlePageChange}
            />
            {showFormModal && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    item={editingItem}
                    formType={'userStatus'}
                    onSubmit={(formData) => handleUpdate(editingItem._id, formData)}
                    loading={loading}
                />
            )}
        </div>
    );
}


// --- Trang Nhân viên ---
function StaffPage({ userInfo }) {
    const [staffData, setStaffData] = useState({ items: [], page: 1, pages: 1, total: 0 }); // Đổi state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const fetchData = useCallback(async (page = 1) => { // Thêm page
        setLoading(true); setError('');
        try {
            const { data } = await api.get('/staff', { params: { page } }); // Gửi page
            setStaffData({ // Cập nhật state
                items: data.staff || [], // Backend trả key 'staff'
                page: data.page || 1,
                pages: data.pages || 1,
                total: data.total || 0
            });
        } catch (err) { setError(`Lỗi tải nhân viên: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchData(1); }, [fetchData]);

    // Copy handlers và sửa lại fetchData call
    const handleCreate = async (formData) => {
        setLoading(true); setError('');
        try { await api.post('/staff', formData); setShowFormModal(false); fetchData(1);/* Fetch lại trang 1 sau khi tạo */ }
        catch (err) { setError(`Lỗi tạo NV: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const handleUpdate = async (id, formData) => {
        setLoading(true); setError('');
        try { await api.put(`/staff/${id}`, formData); setShowFormModal(false); fetchData(staffData.page);/* Fetch lại trang hiện tại */ }
        catch (err) { setError(`Lỗi cập nhật NV: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const handleDelete = async (id, itemName = "nhân viên") => {
        if (!window.confirm(`Xóa ${itemName}?`)) return;
        setLoading(true); setError('');
        try { await api.delete(`/staff/${id}`); fetchData(1); /* Về trang 1 */ }
        catch (err) { setError(`Lỗi xóa NV: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };
    const openForm = (item = null) => { setEditingItem(item); setShowFormModal(true); setError(''); };

    // Hàm xử lý chuyển trang
    const handlePageChange = (newPage) => {
        fetchData(newPage);
    };

    return (
        <div>
            {loading && <div className="loading-indicator">Đang tải...</div>}
            {error && <div className="error-message">{error} <button onClick={() => setError('')}>Đóng</button></div>}
            <StaffView
                staffs={staffData.items} // Truyền items
                onEdit={openForm}
                onDelete={(id) => handleDelete(id)}
                onCreate={() => openForm(null)}
                totalStaff={staffData.total} // Truyền total (tuỳ chọn)
            />
            {/* Thêm Pagination */}
            <Pagination
                currentPage={staffData.page}
                totalPages={staffData.pages}
                onPageChange={handlePageChange}
            />
            {showFormModal && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    item={editingItem}
                    formType={'staff'}
                    onSubmit={editingItem ? (formData) => handleUpdate(editingItem._id, formData) : handleCreate}
                    loading={loading}
                />
            )}
        </div>
    );
}


// --- Components dùng chung (từ code trước, giữ nguyên hoặc chỉnh sửa nhỏ) ---
const LoginForm = ({ onLogin, loading, error }) => { // onLogin bây giờ là hàm nhận username/password
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Hàm handleSubmit nội bộ của LoginForm
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn chặn reload trang
        // Gọi hàm onLogin (truyền từ LoginPage) với state hiện tại
        onLogin(username, password);
    };

    return (
        <div className="login-form-wrapper">
            {/* onSubmit bây giờ gọi hàm handleSubmit nội bộ */}
            <form onSubmit={handleSubmit} className="login-form">
                <h2>Đăng nhập Dashboard</h2>
                {error && <p className="login-error-message">{error}</p>} {/* Đổi class nếu cần */}
                <div className="form-group">
                    <label htmlFor="login-username">Username:</label> {/* Đổi id để tránh trùng */}
                    <input
                        type="text"
                        id="login-username"
                        name="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="login-password">Password:</label> {/* Đổi id */}
                    <input
                        type="password"
                        id="login-password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>
            </form>
        </div>
    );
}; // Không cần React.memo ở đây nữa cho đơn giản

const ProductsView = React.memo(({ productsData, onEdit, onDelete, onCreate, isAdmin, fetchData, currentPage }) => {/* ... copy code ProductsView ... */
    const { items = [], page = 1, pages = 1, total = 0 } = productsData || {};

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pages) {
            fetchData(newPage); // Chỉ cần truyền page
        }
    };

    return (
        <div className="view-container">
            <h2>Quản lý Sản phẩm ({total})</h2>
            <button onClick={onCreate} className="btn-create">Thêm Sản phẩm Mới</button>
            <DataTable
                headers={['Tên SP', 'SKU', 'Giá', 'Tồn kho', 'Ngày tạo', 'Hành động']}
                items={items}
                renderRow={(item) => (
                    <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.sku || '-'}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td style={{ color: item.stock_quantity < 10 ? 'red' : 'inherit' }}>{item.stock_quantity}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                            <button onClick={() => onEdit(item)} className="btn-edit">Sửa</button>
                            {isAdmin && <button onClick={() => onDelete(item._id)} className="btn-delete">Xóa</button>}
                        </td>
                    </tr>
                )}
            />
            <Pagination currentPage={page} totalPages={pages} onPageChange={handlePageChange} />
        </div>
    );
});
const OrdersView = React.memo(({ orders, onEditStatus, totalOrders }) => { // Nhận totalOrders (tuỳ chọn)
    return (
        <div className="view-container">
            <h2>Quản lý Đơn hàng ({totalOrders ? totalOrders.toLocaleString('vi-VN') : 0})</h2> {/* Hiển thị total */}
            <DataTable
                headers={['Mã ĐH', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'TT Thanh toán', 'TT Đơn hàng', 'NV Xử lý', 'Hành động']}
                items={orders} // Sử dụng prop 'orders' (chứa items)
                renderRow={(item) => (
                    // ... nội dung render row giữ nguyên ...
                    <tr key={item._id}>
                        <td>{item._id.slice(-6)}...</td>
                        <td>{item.customer_name}<br /><small>{item.customer_email}</small></td>
                        <td>{formatDate(item.order_date)}</td>
                        <td>{formatCurrency(item.total_amount)}</td>
                        <td><span className={`status status-payment-${item.payment_status}`}>{item.payment_status}</span></td>
                        <td><span className={`status status-order-${item.status}`}>{item.status}</span></td>
                        <td>{item.staff_id?.full_name || '-'}</td>
                        <td><button onClick={() => onEditStatus(item)} className="btn-edit">Cập nhật TT</button></td>
                    </tr>
                )}
            />
        </div>
    );
});

const UsersView = React.memo(({ users, onEditStatus, onDelete, isAdmin, totalUsers }) => { // Nhận totalUsers
    return (
        <div className="view-container">
            <h2>Quản lý Khách hàng ({totalUsers ? totalUsers.toLocaleString('vi-VN') : 0})</h2>
            <DataTable
                headers={['Tên KH', 'Username', 'Email', 'SĐT', 'Địa chỉ', 'Trạng thái', 'Ngày tạo', 'Hành động']}
                items={users} // Nhận users (là items)
                renderRow={(item) => (
                    // ... nội dung render row giữ nguyên ...
                    <tr key={item._id}>
                        <td>{item.full_name || '-'}</td><td>{item.username}</td>
                        <td>{item.email}</td><td>{item.phone_number || '-'}</td>
                        <td>{item.address || '-'}</td>
                        <td><span className={item.is_active ? 'status-active' : 'status-inactive'}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                            <button onClick={() => onEditStatus(item)} className="btn-edit">Đổi TT</button>
                            {isAdmin && <button onClick={() => onDelete(item._id)} className="btn-delete">Xóa</button>}
                        </td>
                    </tr>
                )}
            />
        </div>
    );
});
const StaffView = React.memo(({ staffs, onEdit, onDelete, onCreate, totalStaff }) => { // Nhận totalStaff
    return (
        <div className="view-container">
            <h2>Quản lý Nhân viên ({totalStaff ? totalStaff.toLocaleString('vi-VN') : 0})</h2>
            <button onClick={onCreate} className="btn-create">Thêm Nhân viên Mới</button>
            <DataTable
                headers={['Tên NV', 'Username', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động']}
                items={staffs} // Nhận staffs (là items)
                renderRow={(item) => (
                    // ... nội dung render row giữ nguyên ...
                    <tr key={item._id}>
                        <td>{item.full_name}</td><td>{item.username}</td>
                        <td>{item.email}</td><td>{item.role}</td>
                        <td><span className={item.is_active ? 'status-active' : 'status-inactive'}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                            <button onClick={() => onEdit(item)} className="btn-edit">Sửa</button>
                            {/* TODO: Ngăn xóa chính mình (cần userInfo hoặc ID của user đang login) */}
                            <button onClick={() => onDelete(item._id)} className="btn-delete">Xóa</button>
                        </td>
                    </tr>
                )}
            />
        </div>
    );
});
const DataTable = React.memo(({ headers, items, renderRow }) => {/* ... copy code DataTable ... */
    if (!Array.isArray(items) || items.length === 0) {
        return <p className="no-data-message">Không có dữ liệu.</p>;
    }
    return (
        <div className="table-responsive">
            <table>
                <thead>
                    <tr>
                        {headers.map((header, index) => <th key={index}>{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => renderRow(item))}
                </tbody>
            </table>
        </div>
    );
});
const Pagination = React.memo(({ currentPage, totalPages, onPageChange }) => {/* ... copy code Pagination ... */
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5; // Maximum number of page buttons to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // Adjust startPage if endPage hits the limit early
    if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }


    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <button onClick={() => onPageChange(1)} disabled={currentPage === 1}>«« Đầu</button>
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>« Trước</button>

            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)}>1</button>
                    {startPage > 2 && <span>...</span>}
                </>
            )}

            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={currentPage === number ? 'active' : ''}
                >
                    {number}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span>...</span>}
                    <button onClick={() => onPageChange(totalPages)}>{totalPages}</button>
                </>
            )}

            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau »</button>
            <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>Cuối »»</button>
        </div>
    );
});
// Lưu ý: FormModal nên được copy cẩn thận, đảm bảo props và logic useEffect đúng
const FormModal = ({ isOpen, onClose, item, formType, onSubmit, loading }) => {/* ... copy code FormModal ... */
    const [formData, setFormData] = useState({});
    useEffect(() => {
        if (item) {
            let initialData = { ...item };
            if (formType === 'staff') delete initialData.password_hash;
            if (formType === 'orderStatus') initialData = { status: item.status, payment_status: item.payment_status, notes: item.notes || '' };
            if (formType === 'userStatus') initialData = { is_active: item.is_active };
            setFormData(initialData);
        } else {
            let defaultData = {};
            if (formType === 'product') defaultData = { price: 0, stock_quantity: 0 };
            if (formType === 'staff') defaultData = { role: 'staff', is_active: true };
            if (formType === 'userStatus') defaultData = { is_active: true };
            if (formType === 'orderStatus') defaultData = { status: 'pending', payment_status: 'pending', notes: '' };
            setFormData(defaultData);
        }
    }, [item, formType, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value) })); // Handle empty number input
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        let dataToSend = { ...formData };
        // Basic conversions before sending
        if (dataToSend.is_active !== undefined) dataToSend.is_active = String(dataToSend.is_active) === 'true';
        if (dataToSend.stock_quantity !== undefined && dataToSend.stock_quantity !== '') dataToSend.stock_quantity = parseInt(dataToSend.stock_quantity, 10); else if (formType === 'product') delete dataToSend.stock_quantity; // Don't send empty string as number
        if (dataToSend.price !== undefined && dataToSend.price !== '') dataToSend.price = parseFloat(dataToSend.price); else if (formType === 'product') delete dataToSend.price;

        if (formType === 'staff' && item && (!dataToSend.password || dataToSend.password.trim() === '')) { delete dataToSend.password; }
        // Validation (should be more robust)
        if (formType === 'staff' && !item && !dataToSend.password) { alert('Vui lòng nhập mật khẩu NV mới.'); return; }
        if (formType === 'product' && (!dataToSend.name || dataToSend.price === undefined || dataToSend.stock_quantity === undefined)) { alert('Tên, Giá, SL Tồn kho là bắt buộc.'); return; }

        onSubmit(dataToSend);
    };

    const renderFormFields = () => {
        switch (formType) {
            case 'product': return (<>...</>); // Copy JSX from previous FormModal
            case 'staff': return (<>...</>); // Copy JSX
            case 'userStatus': return (<>...</>); // Copy JSX
            case 'orderStatus': return (<>...</>); // Copy JSX
            default: return <p>Loại form không xác định.</p>;
        }
    };
    const renderProductFields = () => ( /* ... Copy JSX for product fields ... */
        <>
            <InputField label="Tên Sản phẩm" name="name" value={formData.name || ''} onChange={handleChange} required disabled={loading} />
            <InputField label="SKU" name="sku" value={formData.sku || ''} onChange={handleChange} disabled={loading} />
            <InputField label="Giá (VND)" name="price" type="number" value={formData.price === undefined ? '' : formData.price} onChange={handleChange} required min="0" disabled={loading} />
            <InputField label="Số lượng tồn kho" name="stock_quantity" type="number" value={formData.stock_quantity === undefined ? '' : formData.stock_quantity} onChange={handleChange} required min="0" disabled={loading} />
            <InputField label="URL Hình ảnh" name="image_url" value={formData.image_url || ''} onChange={handleChange} disabled={loading} />
            <TextareaField label="Mô tả" name="description" value={formData.description || ''} onChange={handleChange} disabled={loading} />
        </>
    );
    const renderStaffFields = () => (/* ... Copy JSX for staff fields ... */
        <>
            <InputField label="Họ và tên" name="full_name" value={formData.full_name || ''} onChange={handleChange} required disabled={loading} />
            <InputField label="Username" name="username" value={formData.username || ''} onChange={handleChange} required disabled={loading || !!item /* Không cho sửa username */} />
            <InputField label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required disabled={loading} />
            <InputField label="Số điện thoại" name="phone_number" value={formData.phone_number || ''} onChange={handleChange} disabled={loading} />
            <SelectField label="Vai trò" name="role" value={formData.role || 'staff'} onChange={handleChange} options={[{ value: 'staff', label: 'Nhân viên' }, { value: 'admin', label: 'Admin' }]} required disabled={loading} />
            <InputField label="Mật khẩu" name="password" type="password" onChange={handleChange} placeholder={item ? "Để trống nếu không muốn đổi" : ""} required={!item} disabled={loading} />
            <SelectField label="Trạng thái" name="is_active" value={String(formData.is_active ?? true)} onChange={handleChange} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]} required disabled={loading} />
        </>
    );
    const renderUserStatusFields = () => (/* ... Copy JSX for user status field ... */
        <SelectField label="Trạng thái Khách hàng" name="is_active" value={String(formData.is_active ?? true)} onChange={handleChange} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]} required disabled={loading} />
    );
    const renderOrderStatusFields = () => (/* ... Copy JSX for order status fields ... */
        <>
            <p><strong>Mã đơn:</strong> {item?._id.slice(-8)}...</p>
            <p><strong>Khách hàng:</strong> {item?.customer_name}</p>
            <SelectField label="Trạng thái Đơn hàng" name="status" value={formData.status || 'pending'} onChange={handleChange}
                options={[{ value: 'pending', label: 'Chờ xử lý' }, { value: 'processing', label: 'Đang xử lý' }, /*...*/{ value: 'failed', label: 'Thất bại' },]} required disabled={loading} />
            <SelectField label="Trạng thái Thanh toán" name="payment_status" value={formData.payment_status || 'pending'} onChange={handleChange}
                options={[{ value: 'pending', label: 'Chưa TT' }, { value: 'paid', label: 'Đã TT' }, { value: 'failed', label: 'Lỗi TT' },]} required disabled={loading} />
            <TextareaField label="Ghi chú (NV)" name="notes" value={formData.notes || ''} onChange={handleChange} disabled={loading} />
        </>
    );

    // Map type to rendering function
    const formFieldsMap = {
        product: renderProductFields,
        staff: renderStaffFields,
        userStatus: renderUserStatusFields,
        orderStatus: renderOrderStatusFields,
    };
    const renderCurrentFormFields = formFieldsMap[formType] || (() => <p>Loại form không xác định.</p>);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{item ? `Chỉnh sửa ${formType}` : `Tạo mới ${formType}`}</h2>
                <form onSubmit={handleSubmit}>
                    {renderCurrentFormFields()}
                    <div className="modal-actions">
                        <button type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
                        <button type="button" onClick={onClose} disabled={loading}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Copy InputField, TextareaField, SelectField components here
const InputField = React.memo(({ label, type = 'text', name, value, onChange, required = false, disabled = false, ...props }) => ( /*...*/
    <div className="form-group">
        <label htmlFor={name}>{label}{required && '*'}:</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} disabled={disabled} {...props} />
    </div>
));
const TextareaField = React.memo(({ label, name, value, onChange, required = false, disabled = false, ...props }) => (/*...*/
    <div className="form-group">
        <label htmlFor={name}>{label}{required && '*'}:</label>
        <textarea id={name} name={name} value={value} onChange={onChange} required={required} disabled={disabled} rows="3" {...props} ></textarea>
    </div>
));
const SelectField = React.memo(({ label, name, value, onChange, options, required = false, disabled = false, ...props }) => (/*...*/
    <div className="form-group">
        <label htmlFor={name}>{label}{required && '*'}:</label>
        <select id={name} name={name} value={value} onChange={onChange} required={required} disabled={disabled} {...props} >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
));


// --- Helper Functions ---
// Copy formatDate, formatCurrency functions here
const formatCurrency = (amount) => { /*...*/
    if (amount === null || amount === undefined || amount === '') return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
const formatDate = (dateString) => { /*...*/
    if (!dateString) return '-';
    try {
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateString));
    } catch (e) { return 'Invalid Date'; }
};

export default App;
