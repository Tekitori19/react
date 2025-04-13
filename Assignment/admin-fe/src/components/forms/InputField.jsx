// src/components/forms/InputField.jsx
import React from 'react';

// Props:
// - label: Nhãn hiển thị cho trường input
// - id: ID của input (dùng cho label htmlFor)
// - name: Tên của input (dùng khi submit form)
// - type: Kiểu của input (text, email, password, number...) - mặc định là 'text'
// - value: Giá trị hiện tại của input
// - onChange: Hàm xử lý khi giá trị input thay đổi
// - required: Input có bắt buộc hay không (boolean)
// - disabled: Input có bị vô hiệu hóa hay không (boolean)
// - placeholder: Chữ gợi ý trong input
// - error: Thông báo lỗi (string) nếu có
// - className: Class Tailwind tùy chỉnh thêm vào div bao ngoài
// - ...props: Các thuộc tính input khác (ví dụ: min, max, step cho number)
function InputField({ label, id, name, type = 'text', value, onChange, required = false, disabled = false, placeholder, error, className = '', ...props }) {
    const baseInputClasses = "block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";
    const normalBorderClasses = "border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500";
    const errorBorderClasses = "border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"; // Classes khi có lỗi

    return (
        <div className={`mb-4 ${className}`}> {/* Thêm margin bottom mặc định */}
            {/* Label cho input */}
            <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>} {/* Dấu * nếu bắt buộc */}
            </label>
            {/* Input field */}
            <input
                type={type}
                id={id || name}
                name={name}
                value={value ?? ''} // Đảm bảo value không bao giờ là null/undefined để tránh lỗi uncontrolled component
                onChange={onChange}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                className={`${baseInputClasses} ${error ? errorBorderClasses : normalBorderClasses}`} // Áp dụng class lỗi nếu có
                {...props} // Truyền các props còn lại (min, max, step...)
            />
            {/* Hiển thị thông báo lỗi nếu có */}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default InputField;
