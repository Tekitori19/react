// src/pages/StaffPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import FormModal from '../components/forms/FormModal';
import { formatDate } from '../utils/formatters';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

function StaffPage({ userInfo }) { // Nhận userInfo để check ID nếu cần (ví dụ: không cho xóa chính mình)
    const [staffData, setStaffData] = useState({ items: [], page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Fetch Staff
    const fetchData = useCallback(async (page = 1) => {
        setLoading(true); setError('');
        try {
            const params = { page, limit: 10 }; // Lấy 10 staff/trang
            // TODO: filter theo role, status nếu cần
            const { data } = await api.get('/staff', { params });
            setStaffData({
                items: data.staff || [], page: data.page || 1,
                pages: data.pages || 1, total: data.total || 0
            });
        } catch (err) { setError(`Lỗi tải nhân viên: ${err.response?.data?.message || err.message}`); setStaffData({ items: [], page: 1, pages: 1, total: 0 }); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(1); }, [fetchData]);

    // Handle Create Staff
    const handleCreate = async (formData) => {
        setLoading(true); setError('');
        try {
            await api.post('/staff', formData);
            setShowFormModal(false); fetchData(1); // Về trang 1 sau khi tạo
        } catch (err) { setError(`Lỗi tạo nhân viên: ${err.response?.data?.message || err.message}`); /* Không đóng modal nếu lỗi */ }
        finally { setLoading(false); }
    };

    // Handle Update Staff
    const handleUpdate = async (id, formData) => {
        setLoading(true); setError('');
        try {
            await api.put(`/staff/${id}`, formData);
            setShowFormModal(false); setEditingItem(null);
            fetchData(staffData.page); // Tải lại trang hiện tại
        } catch (err) { setError(`Lỗi cập nhật nhân viên: ${err.response?.data?.message || err.message}`); /* Không đóng modal nếu lỗi */ }
        finally { setLoading(false); }
    };

    // Handle Delete Staff
    const handleDelete = async (id, name) => {
        // Ngăn admin xóa chính mình
        if (userInfo && userInfo._id === id) {
            alert('Bạn không thể xóa tài khoản của chính mình!');
            return;
        }
        if (!window.confirm(`Bạn chắc chắn muốn xóa nhân viên "${name}"?`)) return;
        setLoading(true); setError('');
        try {
            await api.delete(`/staff/${id}`);
            // Tải lại trang 1 hoặc trang hiện tại
            fetchData(1);
        } catch (err) { setError(`Lỗi xóa nhân viên: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    // Open Form Modal
    const openForm = (item = null) => {
        setEditingItem(item); setShowFormModal(true); setError('');
    };

    // Render Staff Row
    const renderStaffRow = (item) => (
        <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
            {/* Tên NV */}
            <td className="px-5 py-3 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{item.full_name}</div>
                <div className="text-sm text-gray-500 hidden sm:block">{item.username}</div>
            </td>
            {/* Email */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{item.email}</td>
            {/* SĐT */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{item.phone_number || '-'}</td>
            {/* Vai trò */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-medium capitalize">
                <span className={`px-2 py-0.5 rounded text-xs ${item.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {item.role}
                </span>
            </td>
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
                <button onClick={() => openForm(item)} className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition" title="Sửa nhân viên">
                    <PencilSquareIcon className="h-5 w-5" />
                </button>
                {/* Chỉ xóa được nếu không phải là chính mình */}
                {userInfo && userInfo._id !== item._id && (
                    <button onClick={() => handleDelete(item._id, item.full_name)} className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition" title="Xóa nhân viên">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </td>
        </tr>
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-semibold text-gray-800">Quản lý Nhân viên ({staffData.total.toLocaleString('vi-VN')})</h1>
                <button onClick={() => openForm(null)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition whitespace-nowrap">
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Thêm Nhân viên
                </button>
            </div>
            {error && <ErrorDisplay message={error} onDismiss={() => setError('')} />}
            {/* Thêm search bar ở đây nếu cần */}
            <DataTable
                headers={['Nhân viên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Hành động']}
                items={staffData.items}
                renderRow={renderStaffRow}
                loading={loading}
                emptyMessage="Không có nhân viên nào."
            />
            <Pagination
                currentPage={staffData.page}
                totalPages={staffData.pages}
                onPageChange={(page) => fetchData(page)}
            />
            {showFormModal && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                    item={editingItem}
                    formType={'staff'}
                    onSubmit={editingItem ? (formData) => handleUpdate(editingItem._id, formData) : handleCreate}
                    loading={loading}
                    title={editingItem ? "Chỉnh sửa Nhân viên" : "Thêm Nhân viên mới"}
                />
            )}
        </div>
    );
}

export default StaffPage;
