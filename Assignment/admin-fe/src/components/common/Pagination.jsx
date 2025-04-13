// src/components/common/Pagination.jsx
import React from 'react';
// Sử dụng icon solid nhỏ hơn cho pagination
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/20/solid';

// Props: currentPage, totalPages, onPageChange
function Pagination({ currentPage, totalPages, onPageChange }) {
    // Không hiển thị gì nếu chỉ có 1 trang hoặc không có trang nào
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5; // Số lượng nút số trang hiển thị tối đa ở giữa
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Điều chỉnh lại startPage nếu endPage chạm đến giới hạn cuối mà chưa đủ maxVisiblePages
    if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Tạo mảng các số trang cần hiển thị
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    // --- Tailwind Classes cho các nút ---
    // Class chung cho các nút (bao gồm cả icon và số)
    const baseButtonClass = "relative inline-flex items-center border px-2.5 py-1.5 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150";
    // Class cho nút thường (không active)
    const defaultButtonClass = "bg-white border-gray-300 text-gray-500 hover:bg-gray-50";
    // Class cho nút đang active (trang hiện tại)
    const activeButtonClass = "z-10 bg-indigo-50 border-indigo-500 text-indigo-600";
    // Class cho dấu '...'
    const ellipsisClass = "relative inline-flex items-center border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700";
    // Class cho icon bên trong nút
    const iconClass = "h-5 w-5"; // Điều chỉnh kích thước nếu cần

    return (
        // Container chính của pagination, căn giữa
        <nav className="flex items-center justify-center mt-6 px-4 sm:px-0" aria-label="Pagination">
            {/* Nút về trang đầu */}
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={`${baseButtonClass} rounded-l-md ${defaultButtonClass}`}
                aria-label="Về trang đầu"
                title="Về trang đầu" // Thêm title cho rõ ràng
            >
                <span className="sr-only">Đầu</span> {/* Screen reader only */}
                <ChevronDoubleLeftIcon className={iconClass} aria-hidden="true" />
            </button>
            {/* Nút lùi 1 trang */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${baseButtonClass} ${defaultButtonClass}`}
                aria-label="Trang trước"
                title="Trang trước"
            >
                <span className="sr-only">Trước</span>
                <ChevronLeftIcon className={iconClass} aria-hidden="true" />
            </button>

            {/* Hiển thị nút trang 1 và dấu '...' nếu cần */}
            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className={`${baseButtonClass} ${defaultButtonClass}`}>1</button>
                    {/* Hiển thị '...' chỉ khi startPage > 2 */}
                    {startPage > 2 && <span className={ellipsisClass}>...</span>}
                </>
            )}

            {/* Hiển thị các nút số trang */}
            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`${baseButtonClass} ${currentPage === number ? activeButtonClass : defaultButtonClass}`}
                    aria-current={currentPage === number ? 'page' : undefined} // Cho biết đây là trang hiện tại
                >
                    {number}
                </button>
            ))}

            {/* Hiển thị dấu '...' và nút trang cuối nếu cần */}
            {endPage < totalPages && (
                <>
                    {/* Hiển thị '...' chỉ khi endPage < totalPages - 1 */}
                    {endPage < totalPages - 1 && <span className={ellipsisClass}>...</span>}
                    <button onClick={() => onPageChange(totalPages)} className={`${baseButtonClass} ${defaultButtonClass}`}>{totalPages}</button>
                </>
            )}

            {/* Nút tiến 1 trang */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${baseButtonClass} ${defaultButtonClass}`}
                aria-label="Trang sau"
                title="Trang sau"
            >
                <span className="sr-only">Sau</span>
                <ChevronRightIcon className={iconClass} aria-hidden="true" />
            </button>
            {/* Nút đến trang cuối */}
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`${baseButtonClass} rounded-r-md ${defaultButtonClass}`}
                aria-label="Đến trang cuối"
                title="Đến trang cuối"
            >
                <span className="sr-only">Cuối</span>
                <ChevronDoubleRightIcon className={iconClass} aria-hidden="true" />
            </button>
        </nav>
    );
}

export default Pagination;
