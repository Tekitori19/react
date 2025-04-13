// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner'; // Import spinner
import { LockClosedIcon, UserIcon } from '@heroicons/react/20/solid'; // Icons cho input

// Props: onLogin là hàm xử lý logic đăng nhập (nhận username, password)
//        loading là trạng thái đang xử lý
function LoginForm({ onLogin, loading }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Hàm nội bộ xử lý sự kiện submit form
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn form reload trang
        // Gọi hàm onLogin được truyền từ cha với username và password hiện tại
        if (!loading) { // Chỉ submit khi không đang loading
            onLogin(username, password);
        }
    };

    return (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {/* Thường không cần input này trong React */}
            {/* <input type="hidden" name="remember" defaultValue="true" /> */}

            <div className="rounded-md shadow-sm -space-y-px"> {/* Gom input thành khối */}
                {/* Input Username */}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        id="login-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        // Classes Tailwind cho input, có padding left cho icon
                        className="appearance-none rounded-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Tên đăng nhập"
                    />
                </div>

                {/* Input Password */}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        // Input thứ hai sẽ bo góc dưới
                        className="appearance-none rounded-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Mật khẩu"
                    />
                </div>
            </div>

            {/* (Optional) Phần "Quên mật khẩu?" nếu có */}
            {/* <div className="flex items-center justify-end">
                <div className="text-sm">
                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                         Quên mật khẩu?
                    </a>
                </div>
            </div> */}

            {/* Nút Submit */}
            <div>
                <button
                    type="submit"
                    disabled={loading}
                    // Classes cho nút, bao gồm cả trạng thái loading và hover/focus
                    className={`group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition ease-in-out duration-150
                         ${loading
                            ? 'bg-indigo-400 cursor-not-allowed' // Màu nhạt hơn khi loading
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {/* Hiển thị spinner hoặc text */}
                    {loading ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-3" /> {/* Spinner nhỏ */}
                            Đang đăng nhập...
                        </>
                    ) : (
                        'Đăng nhập'
                    )}
                </button>
            </div>
        </form>
    );
}

export default LoginForm;
