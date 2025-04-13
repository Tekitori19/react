// src/pages/DashboardHomePage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, TimeScale, Filler } from 'chart.js'; // Import các thành phần chart
import 'chartjs-adapter-date-fns'; // Adapter cho trục thời gian
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import StatCard from '../components/common/StatCard';
import { formatCurrency } from '../utils/formatters';

// Đăng ký các thành phần Chart.js một lần
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    ArcElement, Title, Tooltip, Legend, TimeScale, Filler
);

function DashboardHomePage() {
    const [dashboardSummary, setDashboardSummary] = useState(null);
    const [orderStatusData, setOrderStatusData] = useState(null);
    const [revenueData, setRevenueData] = useState(null);
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Hàm fetch dữ liệu
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Gọi song song các API
            const [summaryRes, statusRes, revenueRes, stockRes] = await Promise.all([
                api.get('/dashboard/stats/summary').catch(e => { console.error("Summary fetch error:", e); return { data: null }; }),
                api.get('/dashboard/stats/order-status').catch(e => { console.error("Order Status fetch error:", e); return { data: [] }; }),
                api.get('/dashboard/stats/revenue-orders-daily').catch(e => { console.error("Revenue fetch error:", e); return { data: [] }; }),
                api.get('/dashboard/stats/product-stock').catch(e => { console.error("Stock fetch error:", e); return { data: { low: 0, medium: 0, high: 0 } }; }),
            ]);

            // Xử lý Summary Data
            setDashboardSummary(summaryRes.data);

            // --- Xử lý Chart Data (Ví dụ chuẩn bị dữ liệu) ---
            // 1. Order Status (Doughnut)
            if (statusRes.data && statusRes.data.length > 0) {
                setOrderStatusData({
                    labels: statusRes.data.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)), // Viết hoa chữ cái đầu
                    datasets: [{
                        label: 'Số lượng',
                        data: statusRes.data.map(item => item.count),
                        backgroundColor: [ // Màu sắc tương ứng với trạng thái (ví dụ)
                            'rgba(255, 159, 64, 0.8)', // Pending
                            'rgba(54, 162, 235, 0.8)', // Processing
                            'rgba(153, 102, 255, 0.8)',// Shipped
                            'rgba(75, 192, 192, 0.8)', // Delivered
                            'rgba(108, 117, 125, 0.8)',// Cancelled
                            'rgba(255, 99, 132, 0.8)'  // Failed
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2,
                    }]
                });
            } else { setOrderStatusData(null); }

            // 2. Revenue & Orders (Line)
            if (revenueRes.data && revenueRes.data.length > 0) {
                setRevenueData({
                    labels: revenueRes.data.map(item => item.date), // Backend trả về date dạng string 'YYYY-MM-DD'
                    datasets: [
                        {
                            label: 'Doanh thu (VND)', data: revenueRes.data.map(item => item.revenue),
                            borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            yAxisID: 'yRevenue', tension: 0.3, fill: true, pointRadius: 2, pointHoverRadius: 5
                        },
                        {
                            label: 'Số đơn', data: revenueRes.data.map(item => item.orders),
                            borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.1)',
                            yAxisID: 'yOrders', tension: 0.3, pointRadius: 2, pointHoverRadius: 5
                        }
                    ]
                });
            } else { setRevenueData(null); }

            // 3. Stock Levels (Bar)
            if (stockRes.data) {
                setStockData({
                    labels: ['Thấp (<10)', 'Trung bình (10-49)', 'Cao (>=50)'],
                    datasets: [{
                        label: 'Số lượng sản phẩm',
                        data: [stockRes.data.low, stockRes.data.medium, stockRes.data.high],
                        backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'],
                        borderColor: ['rgb(255, 99, 132)', 'rgb(255, 205, 86)', 'rgb(75, 192, 192)'],
                        borderWidth: 1,
                        borderRadius: 5, // Bo góc cột
                    }]
                });
            } else { setStockData(null); }

        } catch (err) {
            // Bắt lỗi chung nếu Promise.all bị reject (mặc dù đã có catch riêng lẻ)
            console.error("Error fetching dashboard data:", err);
            setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Gọi fetchData khi component mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Cấu hình Options cho biểu đồ ---
    const lineChartOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom' }, title: { display: false } }, // Tắt title mặc định
        scales: {
            x: { type: 'time', time: { unit: 'day', tooltipFormat: 'dd/MM/yyyy', displayFormats: { day: 'dd/MM' } }, grid: { display: false } },
            yRevenue: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Doanh thu (VND)', font: { size: 10 } }, ticks: { callback: value => formatCurrency(value).replace('₫', '') + 'k' }, grid: { color: '#e9ecef' } },
            yOrders: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Số đơn', font: { size: 10 } }, ticks: { precision: 0 }, grid: { display: false } }
        }
    }), []);

    const doughnutChartOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, cutout: '65%', // Làm cho nó mỏng hơn
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } }, title: { display: false } }
    }), []);

    const barChartOptions = useMemo(() => ({
        responsive: true, maintainAspectRatio: false, indexAxis: 'y', // Chuyển thành bar ngang nếu muốn
        plugins: { legend: { display: false }, title: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#e9ecef' } }, y: { grid: { display: false } } }
    }), []);

    // --- Render ---
    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="space-y-6 md:space-y-8"> {/* Tăng khoảng cách */}
            {/* Tiêu đề Trang */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Tổng Quan</h1>

            {/* Hiển thị lỗi nếu có */}
            {error && <ErrorDisplay message={error} onDismiss={() => setError('')} />}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Render StatCards, kiểm tra dashboardSummary trước */}
                {dashboardSummary ? (
                    <>
                        <StatCard title="Tổng Doanh thu" value={formatCurrency(dashboardSummary.totalRevenue)} icon="💰" />
                        <StatCard title="Tổng Đơn hàng" value={dashboardSummary.totalOrders?.toLocaleString('vi-VN')} icon="🛒" />
                        <StatCard title="Đơn hàng Chờ XL" value={dashboardSummary.pendingOrders?.toLocaleString('vi-VN')} icon="⏳" />
                        <StatCard title="Khách hàng Active" value={dashboardSummary.activeUsers?.toLocaleString('vi-VN')} icon="👥" />
                        <StatCard title="SP sắp hết hàng (<10)" value={dashboardSummary.lowStockProducts?.toLocaleString('vi-VN')} icon="⚠️" />
                    </>
                ) : (
                    // Hiển thị placeholder hoặc thông báo nếu không có dữ liệu summary
                    Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg shadow p-5 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                        </div>
                    ))
                )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Line Chart */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow min-h-[400px] flex flex-col"> {/* Đảm bảo đủ cao */}
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Doanh thu & Đơn hàng (30 ngày qua)</h3>
                    <div className="flex-grow relative"> {/* Cho phép chart co giãn */}
                        {revenueData ? (
                            <Line options={lineChartOptions} data={revenueData} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">Không có dữ liệu</div>
                        )}
                    </div>
                </div>

                {/* Doughnut Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Trạng thái Đơn hàng</h3>
                    <div className="flex-grow relative flex items-center justify-center"> {/* Căn giữa chart */}
                        {orderStatusData ? (
                            <Doughnut options={doughnutChartOptions} data={orderStatusData} />
                        ) : (
                            <div className="text-gray-500">Không có dữ liệu</div>
                        )}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Phân loại Tồn kho</h3>
                    <div className="flex-grow relative">
                        {stockData ? (
                            <Bar options={barChartOptions} data={stockData} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500">Không có dữ liệu</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DashboardHomePage;
