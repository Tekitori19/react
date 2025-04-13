// src/components/forms/TextareaField.jsx
import React from 'react';

// Props: tương tự InputField, thêm prop `rows` để kiểm soát số dòng mặc định
function TextareaField({ label, id, name, value, onChange, required = false, disabled = false, placeholder, error, className = '', rows = 3, ...props }) {
    const baseTextareaClasses = "block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";
    const normalBorderClasses = "border-gray-300 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500";
    const errorBorderClasses = "border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";

    return (
        <div className={`mb-4 ${className}`}>
            <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
                id={id || name}
                name={name}
                rows={rows} // Số dòng mặc định
                value={value ?? ''}
                onChange={onChange}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                className={`${baseTextareaClasses} ${error ? errorBorderClasses : normalBorderClasses}`}
                {...props} // Cho phép truyền các thuộc tính textarea khác
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default TextareaField;
