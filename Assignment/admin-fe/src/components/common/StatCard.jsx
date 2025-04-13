// src/components/common/StatCard.jsx
import React from 'react';

// Props: title (tiêu đề), value (giá trị), icon (emoji hoặc component icon)
function StatCard({ title, value, icon }) {
    return (
        // Sử dụng Tailwind cho layout card, bóng đổ, border và hover effect
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 flex items-center border-l-4 border-blue-500 transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-1">
            {/* Icon */}
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 mr-4">
                <span className="text-2xl" role="img" aria-label={title}>{icon}</span>
                {/* Nếu dùng Heroicons: <IconComponent className="h-6 w-6 text-blue-600" /> */}
            </div>
            {/* Thông tin */}
            <div className="flex-grow">
                <dt className="text-sm font-medium text-gray-500 truncate">
                    {title}
                </dt>
                <dd className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
                    {value ?? '-'}
                </dd>
            </div>
        </div>
    );
}

export default StatCard;
