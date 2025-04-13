// src/components/layout/DashboardLayout.jsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
// Nhớ import các icon cần dùng từ Heroicons
import { PowerIcon, Squares2X2Icon, CubeIcon, ShoppingCartIcon, UsersIcon, UserGroupIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useState } from 'react'; // Dùng cho mobile menu

function DashboardLayout({ userInfo, onLogout }) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false); // State cho mobile menu

    // Hàm kiểm tra link active chính xác hơn
    const isActive = (path) => {
        if (path === '/') return location.pathname === '/'; // Root path
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { path: '/', label: 'Tổng quan', icon: Squares2X2Icon, roles: ['admin', 'staff'] },
        { path: '/products', label: 'Sản phẩm', icon: CubeIcon, roles: ['admin', 'staff'] },
        { path: '/orders', label: 'Đơn hàng', icon: ShoppingCartIcon, roles: ['admin', 'staff'] },
        { path: '/users', label: 'Khách hàng', icon: UsersIcon, roles: ['admin', 'staff'] },
        { path: '/staff', label: 'Nhân viên', icon: UserGroupIcon, roles: ['admin'] },
    ];

    const renderNavLink = (item) => (
        <li key={item.path} className="px-2 sm:px-4 py-1">
            <Link
                to={item.path}
                onClick={() => setSidebarOpen(false)} // Đóng sidebar khi click link trên mobile
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out group
                    ${isActive(item.path)
                        ? 'bg-indigo-600 text-white shadow-sm' // Active state nổi bật hơn
                        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                    }`}
            >
                <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} aria-hidden="true" />
                {item.label}
            </Link>
        </li>
    );

    const sidebarContent = (
        <>
            {/* Header Sidebar */}
            <div className="h-16 flex items-center justify-center text-white text-xl font-bold border-b border-gray-700 flex-shrink-0 px-4">
                <span className="truncate">Shop Dashboard</span>
            </div>
            {/* Nav */}
            <nav className="flex-grow mt-5 px-2 space-y-1 overflow-y-auto"> {/* Dùng space-y cho khoảng cách */}
                <ul>{navItems.filter(item => item.roles.includes(userInfo?.role)).map(renderNavLink)}</ul>
            </nav>
            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-700 mt-auto flex-shrink-0">
                {userInfo && (
                    <div className="text-sm mb-3">
                        <p className="font-medium text-white truncate">{userInfo.full_name || userInfo.username}</p>
                        <p className="text-gray-400 text-xs">{userInfo.role}</p>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
                >
                    <PowerIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Đăng xuất
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-gray-100">
            {/* --- Sidebar cho Desktop --- */}
            <aside className="w-64 flex-shrink-0 bg-gray-900 text-gray-300 flex flex-col hidden md:flex">
                {sidebarContent}
            </aside>

            {/* --- Mobile Sidebar (Overlay) --- */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
                {/* Overlay */}
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
                {/* Sidebar Content */}
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900 text-gray-300">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            type="button"
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Đóng sidebar</span>
                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {sidebarContent} {/* Render nội dung sidebar ở đây */}
                </div>
                <div className="flex-shrink-0 w-14" aria-hidden="true"> {/* Dummy element to force sidebar to shrink to fit close icon */} </div>
            </div>


            {/* Main Content Area */}
            <div className="flex-grow flex flex-col overflow-hidden">
                {/* Header (Chỉ hiện trên Desktop hoặc thanh header riêng trên mobile) */}
                <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
                    {/* Nút mở mobile menu */}
                    <button
                        type="button"
                        className="md:hidden border border-gray-300 rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Mở menu</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    {/* Placeholder hoặc tiêu đề trang cho Desktop Header */}
                    <div className="flex-1 hidden md:block">
                        {/* <h1 className="text-xl font-semibold text-gray-700"> {location.pathname.split('/').pop() || 'Tổng quan'} </h1> */}
                    </div>
                    {/* User info hoặc actions khác trên Desktop Header */}
                    <div className="hidden md:block">
                        {/* <span className="text-sm text-gray-600 mr-4">Xin chào, {userInfo?.username}</span> */}
                    </div>
                </header>

                {/* Vùng nội dung chính */}
                <main className="flex-grow p-4 sm:p-6 overflow-y-auto bg-gray-100">
                    <Outlet /> {/* Component trang con sẽ render ở đây */}
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
