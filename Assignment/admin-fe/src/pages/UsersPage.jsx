// src/pages/UsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import FormModal from '../components/forms/FormModal';
import { formatDate } from '../utils/formatters';
import { PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function UsersPage({ userInfo }) {
    const [usersData, setUsersData] = useState({ items: [], page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // User đang được sửa status

    // Fetch Users
    const fetchData = useCallback(async (page = 1) => {
        setLoading(true); setError('');
        try {
            const params = { page, limit: 15 };
            // TODO: Thêm search, filter theo status nếu cần
            const { data } = await api.get('/users', { params });
            setUsersData({
                items: data.users || [], page: data.page || 1,
                pages: data.pages || 1, total: data.total || 0
            });
        } catch (err) { setError(`Lỗi tải khách hàng: ${err.response?.data?.message || err.message}`); setUsersData({ items: [], page: 1, pages: 1, total: 0 }); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(1); }, [fetchData]);

    // Handle Update User Status
    const handleUpdateStatus = async (id, formData) => {
        const dataToSend = { is_active: String(formData.is_active) === 'true' }; // Chỉ gửi is_active
        setLoading(true); setError('');
        try {
            await api.put(`/users/${id}/status`, dataToSend);
            setShowFormModal(false); setEditingItem(null);
            fetchData(usersData.page);
        } catch (err) { setError(`Lỗi cập nhật trạng thái KH: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    // Handle Delete User (Admin only)
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn chắc chắn muốn xóa khách hàng "${name}"? (Thao tác này không nên làm thường xuyên)`)) return;
        setLoading(true); setError('');
        try {
            await api.delete(`/users/${id}`);
            // Tải lại trang 1 hoặc trang hiện tại tùy logic
            fetchData(1);
        } catch (err) { setError(`Lỗi xóa khách hàng: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    // Open Modal Edit Status
    const openEditStatusModal = (item) => {
        setEditingItem(item); setShowFormModal(true); setError('');
    };

    // Render User Row
    const renderUserRow = (item) => (
        <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
            {/* Tên KH */}
            <td className="px-5 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.full_name || item.username}</div>
                <div className="text-sm text-gray-500 hidden sm:block">{item.username}</div> {/* Hiển thị username phụ */}
            </td>
            {/* Email */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
            {/* SĐT */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{item.phone_number || '-'}</td>
            {/* Địa chỉ (rút gọn) */}
            <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate">{item.address || '-'}</td> {/* truncate để không quá dài */}
            {/* Trạng thái */}
            <td className="px-5 py-3 whitespace-nowrap text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.is_active ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                    {item.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            {/* Ngày tạo */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
            {/* Hành động */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-medium space-x-2 text-right">
                <button onClick={() => openEditStatusModal(item)} className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition" title="Đổi trạng thái">
                    <PencilSquareIcon className="h-5 w-5" />
                </button>
                {userInfo?.role === 'admin' && (
                    <button onClick={() => handleDelete(item._id, item.full_name || item.username)} className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition" title="Xóa khách hàng">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </td>
        </tr>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý Khách hàng ({usersData.total.toLocaleString('vi-VN')})</h1>
            {error && <ErrorDisplay message={error} onDismiss={() => setError('')} />}
            {/* Thêm search bar ở đây nếu cần */}
            <DataTable
                headers={['Khách hàng', 'Email', 'SĐT', 'Địa chỉ', 'Trạng thái', 'Ngày tạo', 'Hành động']}
                items={usersData.items}
                renderRow={renderUserRow}
                loading={loading}
                emptyMessage="Không có khách hàng nào."
            />
            <Pagination
                currentPage={usersData.page}
                totalPages={usersData.pages}
                onPageChange={(page) => fetchData(page)}
            />
            {showFormModal && editingItem && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                    item={editingItem}
                    formType={'userStatus'}
                    onSubmit={(formData) => handleUpdateStatus(editingItem._id, formData)}
                    loading={loading}
                    title="Thay đổi trạng thái Khách hàng"
                />
            )}
        </div>
    );
}

export default UsersPage;
