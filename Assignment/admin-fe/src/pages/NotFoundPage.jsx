// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/20/solid'; // Icon nút back

function NotFoundPage({ insideDashboard = false }) {
    const message = "Rất tiếc, trang bạn tìm kiếm không tồn tại.";
    const suggestion = insideDashboard
        ? "Bạn có thể quay lại trang tổng quan."
        : "Bạn có thể quay lại trang đăng nhập.";
    const backLink = insideDashboard ? "/" : "/login";
    const linkText = insideDashboard ? "Về Tổng quan" : "Về Trang Đăng nhập";

    if (insideDashboard) {
        // Layout đơn giản cho trang 404 bên trong dashboard
        return (
            <div className="text-center py-10 px-4">
                <h1 className="text-4xl font-bold text-gray-700 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-2">{message}</p>
                <p className="text-gray-500 mb-6">{suggestion}</p>
                <Link
                    to={backLink}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    {linkText}
                </Link>
            </div>
        );
    } else {
        // Layout toàn trang cho 404 bên ngoài (nếu truy cập trực tiếp)
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-8xl font-extrabold text-indigo-600 mb-2">404</h1>
                    <h2 className="text-3xl font-semibold text-gray-800 mb-4">Trang Không Tìm Thấy</h2>
                    <p className="text-gray-600 mb-6">{message} {suggestion}</p>
                    <Link
                        to={backLink}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        {linkText}
                    </Link>
                </div>
            </div>
        );
    }
}

export default NotFoundPage;
