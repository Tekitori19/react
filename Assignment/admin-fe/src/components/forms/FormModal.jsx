// src/components/forms/FormModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import InputField from './InputField'; // Import các fields
import SelectField from './SelectField';
import TextareaField from './TextareaField';
import { XMarkIcon } from '@heroicons/react/24/outline'; // Icon nút đóng
import { formatCurrency } from '../../utils/formatters';

// Props:
// - isOpen: Trạng thái modal có đang mở không (boolean)
// - onClose: Hàm callback khi đóng modal (do click nút hủy hoặc overlay)
// - item: Dữ liệu của item đang sửa (object), hoặc null nếu đang tạo mới
// - formType: Loại form ('product', 'staff', 'userStatus', 'orderStatus') để render đúng fields
// - onSubmit: Hàm callback xử lý khi submit form (nhận formData)
// - loading: Trạng thái loading khi submit (boolean)
// - title: (Optional) Tiêu đề tùy chỉnh cho modal
function FormModal({ isOpen, onClose, item, formType, onSubmit, loading = false, title }) {
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({}); // State để lưu lỗi validation từng trường

    // --- Logic điền/reset form ---
    useEffect(() => {
        // Chỉ thực hiện khi modal mở ra
        if (isOpen) {
            setFormErrors({}); // Reset lỗi khi mở form
            if (item) {
                // Chế độ Sửa: điền dữ liệu từ `item` vào form
                let initialData = { ...item };
                // Bỏ qua các trường không cần thiết hoặc cần xử lý đặc biệt
                if (formType === 'staff') delete initialData.password_hash;
                if (formType === 'orderStatus') initialData = { status: item.status, payment_status: item.payment_status, notes: item.notes || '' };
                if (formType === 'userStatus') initialData = { is_active: item.is_active ?? true }; // Mặc định true nếu chưa có

                setFormData(initialData);
            } else {
                // Chế độ Tạo mới: Đặt giá trị mặc định nếu cần
                let defaultData = {};
                if (formType === 'product') defaultData = { name: '', price: 0, stock_quantity: 0, sku: '', description: '', image_url: '' };
                if (formType === 'staff') defaultData = { username: '', full_name: '', email: '', password: '', role: 'staff', is_active: true };
                if (formType === 'userStatus') defaultData = { is_active: true };
                if (formType === 'orderStatus') defaultData = { status: 'pending', payment_status: 'pending', notes: '' };
                setFormData(defaultData);
            }
        }
    }, [item, formType, isOpen]); // Effect chạy lại khi các giá trị này thay đổi VÀ modal đang mở

    // --- Xử lý thay đổi input ---
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value // Cập nhật giá trị tương ứng
        }));
        // Xóa lỗi của trường đang nhập khi người dùng thay đổi giá trị
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [formErrors]);

    // --- Basic Client-side Validation ---
    const validateForm = () => {
        const errors = {};
        if (formType === 'product') {
            if (!formData.name?.trim()) errors.name = "Tên sản phẩm là bắt buộc.";
            if (formData.price === undefined || formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) errors.price = "Giá phải là số không âm.";
            if (formData.stock_quantity === undefined || formData.stock_quantity === '' || !Number.isInteger(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) errors.stock_quantity = "Số lượng tồn kho phải là số nguyên không âm.";
            // Thêm validation cho SKU nếu cần (ví dụ: không được trùng) - Nên check cả backend
        } else if (formType === 'staff') {
            if (!formData.full_name?.trim()) errors.full_name = "Họ tên là bắt buộc.";
            if (!formData.username?.trim()) errors.username = "Tên đăng nhập là bắt buộc.";
            if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email không hợp lệ.";
            if (!item && !formData.password?.trim()) errors.password = "Mật khẩu là bắt buộc khi tạo mới."; // Chỉ bắt buộc khi tạo mới
            if (item && formData.password && formData.password.trim().length < 6) errors.password = "Mật khẩu mới phải có ít nhất 6 ký tự."; // Optional: check độ dài khi đổi pass
        }
        // Thêm validation cho các form type khác nếu cần

        setFormErrors(errors);
        return Object.keys(errors).length === 0; // Trả về true nếu không có lỗi
    };


    // --- Xử lý Submit Form ---
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) { // Validate trước khi submit
            console.log("Form validation failed:", formErrors);
            return; // Ngăn chặn submit nếu có lỗi
        }

        // Chuẩn bị dữ liệu gửi đi (có thể cần chuyển đổi kiểu dữ liệu)
        let dataToSend = { ...formData };
        if (formType === 'product') {
            dataToSend.price = parseFloat(dataToSend.price) || 0;
            dataToSend.stock_quantity = parseInt(dataToSend.stock_quantity, 10) || 0;
        }
        if (formType === 'staff') {
            // Nếu sửa mà password để trống -> không gửi trường password
            if (item && (!dataToSend.password || dataToSend.password.trim() === '')) {
                delete dataToSend.password;
            }
            // Chuyển is_active thành boolean
            dataToSend.is_active = String(dataToSend.is_active) === 'true';
        }
        if (formType === 'userStatus') {
            dataToSend.is_active = String(dataToSend.is_active) === 'true';
        }

        // Gọi hàm onSubmit được truyền từ cha với dữ liệu đã xử lý
        onSubmit(dataToSend);
        // Lưu ý: Modal KHÔNG tự đóng sau khi submit, component cha sẽ quyết định đóng dựa vào kết quả gọi API
    };

    // --- Render các trường input dựa vào formType ---
    const renderFormFields = () => {
        switch (formType) {
            case 'product':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4"> {/* Chia 2 cột trên màn hình lớn */}
                        <InputField label="Tên Sản phẩm" name="name" value={formData.name} onChange={handleChange} required error={formErrors.name} />
                        <InputField label="SKU (Mã sản phẩm)" name="sku" value={formData.sku} onChange={handleChange} error={formErrors.sku} />
                        <InputField label="Giá (VND)" name="price" type="number" value={formData.price} onChange={handleChange} required min="0" error={formErrors.price} />
                        <InputField label="Số lượng tồn kho" name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleChange} required min="0" step="1" error={formErrors.stock_quantity} />
                        <InputField label="URL Hình ảnh" name="image_url" value={formData.image_url} onChange={handleChange} error={formErrors.image_url} className="sm:col-span-2" /> {/* Span 2 cột */}
                        <TextareaField label="Mô tả" name="description" value={formData.description} onChange={handleChange} error={formErrors.description} rows={4} className="sm:col-span-2" />
                    </div>
                );
            case 'staff':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                        <InputField label="Họ và tên" name="full_name" value={formData.full_name} onChange={handleChange} required error={formErrors.full_name} />
                        <InputField label="Tên đăng nhập" name="username" value={formData.username} onChange={handleChange} required disabled={!!item /* Không cho sửa username */} error={formErrors.username} />
                        <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required error={formErrors.email} />
                        <InputField label="Số điện thoại" name="phone_number" value={formData.phone_number} onChange={handleChange} error={formErrors.phone_number} />
                        <InputField label="Mật khẩu" name="password" type="password" onChange={handleChange} placeholder={item ? "Để trống nếu không đổi" : ""} required={!item} error={formErrors.password} />
                        <SelectField label="Vai trò" name="role" value={formData.role ?? 'staff'} onChange={handleChange} options={[{ value: 'staff', label: 'Nhân viên' }, { value: 'admin', label: 'Admin' }]} required error={formErrors.role} />
                        <SelectField label="Trạng thái" name="is_active" value={String(formData.is_active ?? true)} onChange={handleChange} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]} required error={formErrors.is_active} />
                    </div>
                );
            case 'userStatus':
                return (
                    <SelectField label="Trạng thái Khách hàng" name="is_active" value={String(formData.is_active ?? true)} onChange={handleChange} options={[{ value: 'true', label: 'Hoạt động' }, { value: 'false', label: 'Ngừng hoạt động' }]} required error={formErrors.is_active} />
                );
            case 'orderStatus':
                return (
                    <>
                        {/* Hiển thị thông tin cơ bản của đơn hàng */}
                        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm space-y-1">
                            <p><span className="font-medium text-gray-600">Mã đơn:</span> <span className="font-mono">{item?._id.slice(-8)}...</span></p>
                            <p><span className="font-medium text-gray-600">Khách hàng:</span> {item?.customer_name}</p>
                            <p><span className="font-medium text-gray-600">Tổng tiền:</span> {formatCurrency(item?.total_amount)}</p>
                        </div>
                        <SelectField label="Trạng thái Đơn hàng" name="status" value={formData.status ?? 'pending'} onChange={handleChange}
                            options={[
                                { value: 'pending', label: 'Chờ xử lý' }, { value: 'processing', label: 'Đang xử lý' },
                                { value: 'shipped', label: 'Đã gửi hàng' }, { value: 'delivered', label: 'Đã giao hàng' },
                                { value: 'cancelled', label: 'Đã hủy' }, { value: 'failed', label: 'Thất bại' }
                            ]} required error={formErrors.status} />
                        <SelectField label="Trạng thái Thanh toán" name="payment_status" value={formData.payment_status ?? 'pending'} onChange={handleChange}
                            options={[
                                { value: 'pending', label: 'Chưa thanh toán' }, { value: 'paid', label: 'Đã thanh toán' },
                                { value: 'failed', label: 'Thanh toán lỗi' }
                            ]} required error={formErrors.payment_status} />
                        <TextareaField label="Ghi chú (nội bộ)" name="notes" value={formData.notes ?? ''} onChange={handleChange} rows={3} error={formErrors.notes} />
                    </>
                );
            default: return <p className="text-red-600">Lỗi: Loại form không hợp lệ.</p>;
        }
    };

    // Nếu modal không mở, không render gì cả
    if (!isOpen) return null;

    // Render Modal
    return (
        // Overlay bao ngoài modal
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
            {/* Container của modal, ngăn chặn đóng khi click vào bên trong */}
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden transform transition-all sm:my-8"
                onClick={e => e.stopPropagation()} // Ngăn đóng khi click vào modal content
            >
                {/* Header Modal */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                        {/* Tiêu đề: Ưu tiên prop title, fallback theo formType và item */}
                        {title || (item ? `Chỉnh sửa ${formType}` : `Tạo mới ${formType}`)}
                    </h3>
                    {/* Nút đóng modal */}
                    <button
                        type="button"
                        className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                        onClick={onClose}
                        aria-label="Đóng modal"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Modal (chứa form) */}
                <form onSubmit={handleSubmit} className="px-5 py-4 overflow-y-auto flex-grow"> {/* Cho phép scroll nếu form dài */}
                    {renderFormFields()}
                </form>

                {/* Footer Modal (chứa nút submit/cancel) */}
                <div className="flex items-center justify-end px-5 py-3 border-t border-gray-200 bg-gray-50 space-x-3">
                    {/* Nút Hủy */}
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading} // Vô hiệu hóa khi đang loading
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Hủy
                    </button>
                    {/* Nút Lưu */}
                    <button
                        type="submit" // Submit form khi click
                        disabled={loading} // Vô hiệu hóa khi đang loading
                        className={`inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150
                            ${loading ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}
                         `}
                        // Gọi handleSubmit của form khi click
                        onClick={(e) => document.querySelector('form')?.requestSubmit?.()} // Cách chuẩn để trigger submit form programmatically
                    // Hoặc đơn giản chỉ cần type="submit" ở trên là đủ nếu button nằm trong form
                    >
                        {loading && <LoadingSpinner size="sm" className="mr-2 -ml-1" />} {/* Spinner khi loading */}
                        {loading ? 'Đang lưu...' : (item ? 'Cập nhật' : 'Tạo mới')} {/* Text nút thay đổi */}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FormModal;
