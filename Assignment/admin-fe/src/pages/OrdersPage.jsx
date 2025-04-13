// src/pages/OrdersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import FormModal from '../components/forms/FormModal';
import { formatCurrency, formatDate } from '../utils/formatters';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline'; // Icon xem chi tiết (nếu có), sửa

function OrdersPage({ userInfo }) {
    const [ordersData, setOrdersData] = useState({ items: [], page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // Đơn hàng đang được cập nhật trạng thái
    const [viewingItem, setViewingItem] = useState(null); // (Optional) Đơn hàng đang xem chi tiết

    // Hàm fetch dữ liệu đơn hàng với phân trang
    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 15 }; // Lấy 15 đơn/trang
            // TODO: Thêm bộ lọc (status, date range, search) nếu cần
            // if(filterStatus) params.status = filterStatus;
            const { data } = await api.get('/orders', { params });
            setOrdersData({
                items: data.orders || [],
                page: data.page || 1,
                pages: data.pages || 1,
                total: data.total || 0
            });
        } catch (err) {
            setError(`Lỗi tải đơn hàng: ${err.response?.data?.message || err.message}`);
            setOrdersData({ items: [], page: 1, pages: 1, total: 0 });
        } finally {
            setLoading(false);
        }
    }, []); // Dependencies có thể thêm vào nếu có filter state

    useEffect(() => {
        fetchData(1); // Lấy trang đầu khi mount
    }, [fetchData]);

    // Hàm cập nhật trạng thái đơn hàng
    const handleUpdateStatus = async (id, formData) => {
        // Chỉ lấy status, payment_status, notes từ formData gửi đi
        const dataToSend = {
            status: formData.status,
            payment_status: formData.payment_status,
            notes: formData.notes,
        };
        setLoading(true); setError('');
        try {
            await api.put(`/orders/${id}/status`, dataToSend);
            setShowFormModal(false); // Đóng modal sau khi thành công
            setEditingItem(null);
            fetchData(ordersData.page); // Tải lại trang hiện tại
        } catch (err) {
            setError(`Lỗi cập nhật trạng thái: ${err.response?.data?.message || err.message}`);
            // Không đóng modal nếu lỗi để user sửa lại hoặc xem lỗi
        } finally {
            setLoading(false);
        }
    };

    // Hàm mở modal cập nhật trạng thái
    const openEditStatusModal = (item) => {
        setEditingItem(item);
        setViewingItem(null); // Đảm bảo chỉ 1 modal mở
        setShowFormModal(true);
        setError('');
    };

    // (Optional) Hàm mở modal xem chi tiết (nếu bạn muốn tạo modal riêng cho việc này)
    // const openViewDetailsModal = (item) => {
    //     setViewingItem(item);
    //     setEditingItem(null);
    //     setShowFormModal(false); // Đóng modal edit nếu đang mở
    //     // Logic để mở modal xem chi tiết
    // };


    // Hàm render một dòng đơn hàng trong bảng
    const renderOrderRow = (item) => (
        <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
            {/* Mã Đơn hàng (rút gọn) */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-mono text-gray-700">{item._id.slice(-6).toUpperCase()}</td>
            {/* Khách hàng */}
            <td className="px-5 py-3 text-sm">
                <div className="font-medium text-gray-900">{item.customer_name || '-'}</div>
                <div className="text-gray-500">{item.customer_email || '-'}</div>
            </td>
            {/* Ngày đặt */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(item.order_date)}</td>
            {/* Tổng tiền */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-800 font-semibold">{formatCurrency(item.total_amount)}</td>
            {/* TT Thanh toán */}
            <td className="px-5 py-3 whitespace-nowrap text-center"> {/* Căn giữa status */}
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                     ${item.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        item.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800' // pending
                    }`}>
                    {item.payment_status}
                </span>
            </td>
            {/* TT Đơn hàng */}
            <td className="px-5 py-3 whitespace-nowrap text-center">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                     ${item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        item.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                item.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                    item.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800' // pending
                    }`}>
                    {item.status}
                </span>
            </td>
            {/* NV Xử lý */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{item.staff_id?.full_name || '-'}</td>
            {/* Hành động */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-medium space-x-2 text-right">
                {/* (Optional) Nút Xem chi tiết */}
                {/* <button onClick={() => openViewDetailsModal(item)} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"><EyeIcon className="h-5 w-5" /></button> */}
                {/* Nút Cập nhật trạng thái */}
                <button
                    onClick={() => openEditStatusModal(item)}
                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
                    title="Cập nhật trạng thái"
                >
                    <PencilIcon className="h-5 w-5" />
                </button>
            </td>
        </tr>
    );

    return (
        <div className="space-y-4">
            {/* Tiêu đề */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-800">Quản lý Đơn hàng ({ordersData.total.toLocaleString('vi-VN')})</h1>
                {/* Có thể thêm nút lọc ở đây */}
            </div>

            {/* Hiển thị lỗi */}
            {error && <ErrorDisplay message={error} onDismiss={() => setError('')} />}

            {/* Bảng dữ liệu */}
            <DataTable
                headers={['Mã ĐH', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'TT Thanh toán', 'TT Đơn hàng', 'NV Xử lý', 'Hành động']}
                items={ordersData.items}
                renderRow={renderOrderRow}
                loading={loading}
                emptyMessage="Không có đơn hàng nào."
            />

            {/* Phân trang */}
            <Pagination
                currentPage={ordersData.page}
                totalPages={ordersData.pages}
                onPageChange={(page) => fetchData(page)}
            />

            {/* Modal Cập nhật Trạng thái */}
            {showFormModal && editingItem && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                    item={editingItem} // Truyền đơn hàng cần sửa
                    formType={'orderStatus'} // Loại form
                    // Truyền hàm handleUpdateStatus đã bind với ID
                    onSubmit={(formData) => handleUpdateStatus(editingItem._id, formData)}
                    loading={loading}
                    title="Cập nhật trạng thái Đơn hàng" // Tiêu đề rõ ràng
                />
            )}

            {/* (Optional) Modal Xem chi tiết đơn hàng */}
            {/* {viewingItem && <OrderDetailsModal order={viewingItem} onClose={() => setViewingItem(null)} />} */}

        </div>
    );
}

export default OrdersPage;
