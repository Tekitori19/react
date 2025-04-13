// src/components/forms/SelectField.jsx
import React from 'react';

// Props:
// - label: Nhãn hiển thị
// - id: ID của select
// - name: Tên của select
// - value: Giá trị đang được chọn
// - onChange: Hàm xử lý khi giá trị thay đổi
// - options: Mảng các object { value: 'gia_tri', label: 'Nhan Hien Thi' }
// - required: Có bắt buộc chọn hay không
// - disabled: Có bị vô hiệu hóa không
// - placeholder: Chữ gợi ý (nếu có)
// - error: Thông báo lỗi
// - className: Class tùy chỉnh
function SelectField({ label, id, name, value, onChange, options = [], required = false, disabled = false, placeholder, error, className = '', ...props }) {
    const baseSelectClasses = "block w-full pl-3 pr-10 py-2 border rounded-md shadow-sm text-base focus:outline-none sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";
    const normalBorderClasses = "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500";
    const errorBorderClasses = "border-red-500 text-red-900 focus:ring-red-500 focus:border-red-500"; // Classes khi có lỗi

    return (
        <div className={`mb-4 ${className}`}>
            <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
                id={id || name}
                name={name}
                value={value ?? ''} // Đảm bảo value không null/undefined
                onChange={onChange}
                required={required}
                disabled={disabled}
                className={`${baseSelectClasses} ${error ? errorBorderClasses : normalBorderClasses}`}
                {...props}
            >
                {/* Option placeholder (nếu có) */}
                {placeholder && <option value="" disabled>{placeholder}</option>}
                {/* Render các options từ mảng */}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default SelectField;
