// src/components/forms/FormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import InputField from './InputField';
import SelectField from './SelectField';
import TextareaField from './TextareaField';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatters'; // Import formatCurrency nếu dùng trong orderStatus

function FormModal({ isOpen, onClose, item, formType, onSubmit, loading = false, title }) {
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});

    // --- Logic điền/reset form ---
    useEffect(() => {
        if (isOpen) {
            console.log('[FormModal] Effect triggered - isOpen:', isOpen, 'item:', item, 'formType:', formType);
            setFormErrors({}); // Reset lỗi
            let initialData = {}; // Khởi tạo

            if (item) {
                // Chế độ Sửa
                initialData = { ...item };
                if (formType === 'staff') delete initialData.password_hash;
                if (formType === 'orderStatus') initialData = { status: item.status, payment_status: item.payment_status, notes: item.notes || '' };
                if (formType === 'userStatus') initialData = { is_active: item.is_active ?? true };

            } else {
                // Chế độ Tạo mới - Xác định giá trị mặc định cho TỪNG loại form
                switch (formType) {
                    case 'product':
                        initialData = { name: '', price: '', stock_quantity: '', sku: '', description: '', image_url: '' };
                        break;
                    case 'staff':
                        initialData = { username: '', full_name: '', email: '', password: '', role: 'staff', is_active: true };
                        break;
                    case 'userStatus': // Mặc định cho user status (nếu có form tạo?)
                        initialData = { is_active: true };
                        break;
                    case 'orderStatus': // Mặc định cho order status (thường không tạo mới)
                        initialData = { status: 'pending', payment_status: 'pending', notes: '' };
                        break;
                    default:
                        console.warn(`[FormModal] No default data defined for formType: ${formType}`);
                        initialData = {}; // Hoặc trả về lỗi nếu loại form không xác định là nghiêm trọng
                        break;
                }
            }
            setFormData(initialData); // Gán state một lần ở cuối
            // console.log('[FormModal] Initial form data set:', initialData);
        }
    }, [item, formType, isOpen]); // Dependencies giữ nguyên

    // --- Xử lý thay đổi input ---
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => {
            console.log(`[FormModal] handleChange: name=${name}, value=${newValue}`);
            return { ...prev, [name]: newValue };
        });
        // Xóa lỗi của trường đang nhập
        if (formErrors[name]) {
            console.log(`[FormModal] Clearing error for field: ${name}`);
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [formErrors]); // Include formErrors in dependencies

    // --- Basic Client-side Validation ---
    const validateForm = () => {
        console.log('[FormModal] Starting validation for formType:', formType, 'Data:', formData);
        const errors = {};
        // Chuyển đổi giá trị number trước khi validate
        const currentPrice = formData.price !== undefined && formData.price !== '' ? Number(formData.price) : undefined;
        const currentStock = formData.stock_quantity !== undefined && formData.stock_quantity !== '' ? Number(formData.stock_quantity) : undefined;

        if (formType === 'product') {
            if (!formData.name?.trim()) errors.name = "Tên sản phẩm là bắt buộc.";
            if (currentPrice === undefined || isNaN(currentPrice) || currentPrice < 0) errors.price = "Giá phải là số không âm.";
            if (currentStock === undefined || !Number.isInteger(currentStock) || currentStock < 0) errors.stock_quantity = "Số lượng tồn kho phải là số nguyên không âm.";
            // Optional SKU validation
        } else if (formType === 'staff') {
            if (!formData.full_name?.trim()) errors.full_name = "Họ tên là bắt buộc.";
            if (!formData.username?.trim()) errors.username = "Tên đăng nhập là bắt buộc.";
            if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email không hợp lệ.";
            if (!item && !formData.password?.trim()) errors.password = "Mật khẩu là bắt buộc khi tạo mới."; // Required on create
            if (item && formData.password && formData.password.trim() && formData.password.trim().length < 6) errors.password = "Mật khẩu mới phải có ít nhất 6 ký tự.";
        }
        // Add validations for other form types if needed
        setFormErrors(errors);
        const isValid = Object.keys(errors).length === 0;
        console.log('[FormModal] Validation result:', isValid, 'Errors:', errors);
        return isValid;
    };


    // --- Xử lý Submit Form ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn chặn form gửi theo cách truyền thống
        console.log('[FormModal] Form submit triggered!');

        if (!validateForm()) {
            console.log("[FormModal] Validation failed, submit prevented.");
            return; // Dừng lại nếu validation thất bại
        }

        // Chuẩn bị dữ liệu gửi đi
        let dataToSend = { ...formData };
        if (formType === 'product') {
            // Chắc chắn chuyển đổi sang số hoặc xóa nếu không hợp lệ/rỗng
            dataToSend.price = (dataToSend.price !== undefined && dataToSend.price !== '' && !isNaN(Number(dataToSend.price))) ? parseFloat(dataToSend.price) : undefined;
            dataToSend.stock_quantity = (dataToSend.stock_quantity !== undefined && dataToSend.stock_quantity !== '' && Number.isInteger(Number(dataToSend.stock_quantity))) ? parseInt(dataToSend.stock_quantity, 10) : undefined;
            // Chỉ gửi đi nếu hợp lệ
            if (dataToSend.price === undefined) delete dataToSend.price;
            if (dataToSend.stock_quantity === undefined) delete dataToSend.stock_quantity;
        }
        if (formType === 'staff') {
            if (item && (!dataToSend.password || dataToSend.password.trim() === '')) {
                delete dataToSend.password; // Không gửi pass nếu để trống khi sửa
            }
            dataToSend.is_active = String(dataToSend.is_active) === 'true'; // Chuyển thành boolean
        }
        if (formType === 'userStatus') {
            dataToSend.is_active = String(dataToSend.is_active) === 'true';
        }

        console.log('[FormModal] Calling props.onSubmit with:', dataToSend);
        onSubmit(dataToSend); // Gọi hàm submit được truyền từ cha
    };

    // --- Render các trường input dựa vào formType ---
    const renderProductFields = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <InputField label="Tên Sản phẩm" name="name" id="prod-name" value={formData.name} onChange={handleChange} required error={formErrors.name} disabled={loading} />
            <InputField label="SKU" name="sku" id="prod-sku" value={formData.sku} onChange={handleChange} error={formErrors.sku} disabled={loading} />
            <InputField label="Giá (VND)" name="price" id="prod-price" type="number" value={formData.price} onChange={handleChange} required min="0" error={formErrors.price} disabled={loading} />
            <InputField label="Số lượng tồn kho" name="stock_quantity" id="prod-stock" type="number" value={formData.stock_quantity} onChange={handleChange} required min="0" step="1" error={formErrors.stock_quantity} disabled={loading} />
            <InputField label="URL Hình ảnh" name="image_url" id="prod-image" value={formData.image_url} onChange={handleChange} error={formErrors.image_url} disabled={loading} className="sm:col-span-2" />
            <TextareaField label="Mô tả" name="description" id="prod-desc" value={formData.description} onChange={handleChange} error={formErrors.description} rows={4} className="sm:col-span-2" disabled={loading} />
        </div>
    );
    const renderStaffFields = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <InputField label="Họ và tên" name="full_name" id="staff-fullname" value={formData.full_name} onChange={handleChange} required error={formErrors.full_name} disabled={loading} />
            <InputField label="Tên đăng nhập" name="username" id="staff-username" value={formData.username} onChange={handleChange} required disabled={!!item || loading} error={formErrors.username} />
            <InputField label="Email" name="email" id="staff-email" type="email" value={formData.email} onChange={handleChange} required error={formErrors.email} disabled={loading} />
            <InputField label="Số điện thoại" name="phone_number" id="staff-phone" value={formData.phone_number} onChange={handleChange} error={formErrors.phone_number} disabled={loading} />
            <InputField label="Mật khẩu" name="password" id="staff-password" type="password" onChange={handleChange} placeholder={item ? "Để trống nếu không đổi" : ""} required={!item} error={formErrors.password} disabled={loading} />
            <SelectField label="Vai trò" name="role" id="staff-role" value={formData.role ?? 'staff'} onChange={handleChange} options={[{ value: 'staff', label: 'Nhân viên' }, { value: 'admin', label: 'Admin' }]} required error={formErrors.role} disabled={loading} />
            <SelectField label="Trạng thái" name="is_active" id="staff-active" value={String(formData.is_active ?? true)} onChange={handleChange} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]} required error={formErrors.is_active} disabled={loading} />
        </div>
    );
    const renderUserStatusFields = () => (
        <SelectField label="Trạng thái Khách hàng" name="is_active" id="user-active" value={String(formData.is_active ?? true)} onChange={handleChange} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]} required error={formErrors.is_active} disabled={loading} />
    );
    const renderOrderStatusFields = () => (
        <>
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm space-y-1">
                <p><span className="font-medium text-gray-600">Mã đơn:</span> <span className="font-mono">{item?._id.slice(-8)}...</span></p>
                <p><span className="font-medium text-gray-600">Khách hàng:</span> {item?.customer_name}</p>
                <p><span className="font-medium text-gray-600">Tổng tiền:</span> {formatCurrency(item?.total_amount)}</p>
            </div>
            <SelectField label="Trạng thái Đơn hàng" name="status" id="order-status" value={formData.status ?? 'pending'} onChange={handleChange}
                options={[
                    { value: 'pending', label: 'Chờ xử lý' }, { value: 'processing', label: 'Đang xử lý' },
                    { value: 'shipped', label: 'Đã gửi hàng' }, { value: 'delivered', label: 'Đã giao hàng' },
                    { value: 'cancelled', label: 'Đã hủy' }, { value: 'failed', label: 'Thất bại' }
                ]} required error={formErrors.status} disabled={loading} />
            <SelectField label="Trạng thái Thanh toán" name="payment_status" id="order-payment" value={formData.payment_status ?? 'pending'} onChange={handleChange}
                options={[{ value: 'pending', label: 'Chưa thanh toán' }, { value: 'paid', label: 'Đã thanh toán' }, { value: 'failed', label: 'Thanh toán lỗi' }]} required error={formErrors.payment_status} disabled={loading} />
            <TextareaField label="Ghi chú (nội bộ)" name="notes" id="order-notes" value={formData.notes ?? ''} onChange={handleChange} rows={3} error={formErrors.notes} disabled={loading} />
        </>
    );
    const formFieldsMap = {
        product: renderProductFields, staff: renderStaffFields,
        userStatus: renderUserStatusFields, orderStatus: renderOrderStatusFields,
    };
    const renderCurrentFormFields = formFieldsMap[formType] || (() => <ErrorDisplay message="Lỗi: Loại form không được hỗ trợ." />);


    // --- Render Modal ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transform transition-all sm:my-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 capitalize"> {/* Viết hoa chữ cái đầu */}
                        {title || (item ? `Chỉnh sửa ${formType.replace(/([A-Z])/g, ' $1')}` : `Tạo mới ${formType.replace(/([A-Z])/g, ' $1')}`)}
                    </h3>
                    <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none" onClick={onClose} aria-label="Đóng">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* QUAN TRỌNG: form bao bọc cả body và footer chứa nút submit */}
                <form onSubmit={handleSubmit}>
                    {/* Body của form */}
                    <div className="px-5 py-4 overflow-y-auto flex-grow" style={{ maxHeight: 'calc(90vh - 120px)' }}> {/* Giới hạn chiều cao body để scroll */}
                        {renderCurrentFormFields()}
                        {/* Hiển thị lỗi validation chung nếu có */}
                        {Object.keys(formErrors).length > 0 && !formErrors._general && (
                            <p className="mt-2 text-xs text-red-600">Vui lòng kiểm tra lại các trường có lỗi.</p>
                        )}
                        {formErrors._general && ( // Lỗi chung không gắn với trường cụ thể
                            <ErrorDisplay message={formErrors._general} />
                        )}
                    </div>

                    {/* Footer chứa nút */}
                    <div className="flex items-center justify-end px-5 py-3 border-t border-gray-200 bg-gray-50 space-x-3">
                        <button
                            type="button" // Quan trọng: nút hủy không phải type submit
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit" // QUAN TRỌNG: type submit cho nút này
                            disabled={loading}
                            className={`inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150
                                ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-60 disabled:cursor-not-allowed
                             `}
                        >
                            {loading && <LoadingSpinner size="sm" className="mr-2 -ml-1 text-white" />}
                            {loading ? 'Đang lưu...' : (item ? 'Cập nhật' : 'Tạo mới')}
                        </button>
                    </div>
                </form> {/* Đóng form ở đây */}

            </div>
        </div>
    );
}

export default FormModal;
