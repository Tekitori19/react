// src/components/common/DataTable.jsx
import React from 'react';
import LoadingSpinner from './LoadingSpinner'; // Import spinner

// Props:
// - headers: Mảng các string tên cột
// - items: Mảng dữ liệu để hiển thị
// - renderRow: Hàm nhận một item và trả về JSX cho một dòng <tr>...</tr>
// - loading: Trạng thái loading (boolean)
// - emptyMessage: Tin nhắn hiển thị khi không có dữ liệu
function DataTable({ headers, items, renderRow, loading = false, emptyMessage = "Không có dữ liệu." }) {

    // Hiển thị loading nếu đang tải
    if (loading) {
        return (
            // Thêm height để giữ chỗ, tránh layout nhảy khi load xong
            <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow mt-4 min-h-[200px]">
                <LoadingSpinner size="md" />
                <span className="ml-3 text-gray-500">Đang tải bảng dữ liệu...</span>
            </div>
        );
    }

    // Hiển thị thông báo nếu không có item
    if (!Array.isArray(items) || items.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 italic bg-white rounded-lg shadow mt-4">
                {emptyMessage}
            </div>
        );
    }

    // Render bảng dữ liệu
    return (
        // Container cho phép cuộn ngang trên màn hình nhỏ
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg mt-4">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
                {/* Phần Header của bảng */}
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map((header, index) => (
                            // Các ô header với padding, căn trái, font chữ,...
                            <th
                                key={index}
                                scope="col"
                                className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                {/* Phần Body của bảng */}
                <tbody className="bg-white divide-y divide-gray-200">
                    {/* Gọi hàm renderRow cho mỗi item trong mảng items */}
                    {items.map(item => renderRow(item))}
                    {/*
                       Ví dụ cấu trúc <tr> và <td> cần trả về từ renderRow:
                       (Đặt trong component cha ví dụ: ProductsPage)

                       renderRow={(item) => (
                           <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                               <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                   {item.name}
                               </td>
                               <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">
                                   {item.sku || '-'}
                               </td>
                                // ... các td khác ...
                               <td className="px-5 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                                   <button className="text-indigo-600 hover:text-indigo-900">Sửa</button>
                                   <button className="text-red-600 hover:text-red-900">Xóa</button>
                               </td>
                           </tr>
                       )}
                   */}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
