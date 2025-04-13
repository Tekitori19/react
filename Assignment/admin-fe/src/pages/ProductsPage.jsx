// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import FormModal from '../components/forms/FormModal'; // Sẽ tạo ở bước sau
import { formatCurrency, formatDate } from '../utils/formatters';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'; // Icons cho nút

function ProductsPage({ userInfo }) {
    const [productsData, setProductsData] = useState({ items: [], page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // null: tạo mới, object: sửa
    const [searchTerm, setSearchTerm] = useState(''); // State cho ô tìm kiếm

    // Hàm Fetch dữ liệu với phân trang và tìm kiếm
    const fetchData = useCallback(async (page = 1, search = searchTerm) => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 10 }; // Lấy 10 item mỗi trang
            if (search) {
                params.searchTerm = search.trim(); // Gửi query tìm kiếm lên backend
            }
            const { data } = await api.get('/products', { params });
            setProductsData({
                items: data.products || [],
                page: data.page || 1,
                pages: data.pages || 1,
                total: data.total || 0
            });
        } catch (err) {
            setError(`Lỗi tải sản phẩm: ${err.response?.data?.message || err.message}`);
            setProductsData({ items: [], page: 1, pages: 1, total: 0 }); // Reset data nếu lỗi
        } finally {
            setLoading(false);
        }
    }, [searchTerm]); // fetchData phụ thuộc searchTerm để khi search thay đổi sẽ fetch lại

    // Fetch lần đầu khi component mount
    useEffect(() => {
        fetchData(1); // Lấy trang 1
    }, [fetchData]); // Chỉ fetch lại nếu hàm fetchData thay đổi (do searchTerm thay đổi)

    // Hàm xử lý submit tìm kiếm (có thể thêm debounce nếu muốn)
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchData(1, searchTerm); // Tìm kiếm thì luôn về trang 1
    };

    // Hàm xử lý các thao tác CRUD (Create, Update, Delete)
    const handleCreate = async (formData) => {
        setLoading(true); setError('');
        try {
            await api.post('/products', formData);
            setShowFormModal(false);
            fetchData(1); // Về trang 1 sau khi tạo mới
            setSearchTerm(''); // Reset ô tìm kiếm
        } catch (err) { setError(`Lỗi tạo sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    const handleUpdate = async (id, formData) => {
        setLoading(true); setError('');
        try {
            await api.put(`/products/${id}`, formData);
            setShowFormModal(false);
            fetchData(productsData.page, searchTerm); // Tải lại trang hiện tại với search term hiện tại
        } catch (err) { setError(`Lỗi cập nhật sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id, name) => {
        // TODO: Tích hợp ConfirmModal thay vì window.confirm
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" không?`)) return;
        setLoading(true); setError('');
        try {
            await api.delete(`/products/${id}`);
            // Fetch lại trang hiện tại sau khi xóa, kiểm tra xem trang có bị trống không
            const remainingItems = productsData.items.length - 1;
            const currentPage = productsData.page;
            const totalPages = productsData.pages;
            if (remainingItems === 0 && currentPage > 1 && currentPage === totalPages) {
                fetchData(currentPage - 1, searchTerm); // Lùi về trang trước nếu trang cuối bị trống
            } else {
                fetchData(currentPage, searchTerm); // Fetch lại trang hiện tại
            }
        } catch (err) { setError(`Lỗi xóa sản phẩm: ${err.response?.data?.message || err.message}`); }
        finally { setLoading(false); }
    };

    // Hàm mở Modal Form
    const openForm = (item = null) => {
        setEditingItem(item); // Nếu item là null => tạo mới, ngược lại => sửa
        setShowFormModal(true);
        setError(''); // Xóa lỗi cũ khi mở form
    };

    // Hàm render nội dung một dòng trong bảng
    const renderProductRow = (item) => (
        <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
            {/* Ảnh sản phẩm (optional) */}
            <td className="px-5 py-3 whitespace-nowrap">
                <img
                    src={item.image_url || 'https://via.placeholder.com/40?text=No+Image'} // Ảnh mặc định
                    alt={item.name}
                    className="h-10 w-10 rounded object-cover" // Style ảnh thumbnail
                />
            </td>
            {/* Tên sản phẩm */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
            {/* SKU */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{item.sku || '-'}</td>
            {/* Giá */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(item.price)}</td>
            {/* Tồn kho (màu sắc theo số lượng) */}
            <td className={`px-5 py-3 whitespace-nowrap text-sm font-semibold ${item.stock_quantity === 0 ? 'text-red-600' :
                    item.stock_quantity < 10 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                {item.stock_quantity}
            </td>
            {/* Ngày tạo */}
            <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
            {/* Hành động (Sửa, Xóa) */}
            <td className="px-5 py-3 whitespace-nowrap text-sm font-medium space-x-2 text-right">
                {/* Nút Sửa */}
                <button
                    onClick={() => openForm(item)}
                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition"
                    title="Sửa sản phẩm"
                >
                    <PencilSquareIcon className="h-5 w-5" />
                </button>
                {/* Nút Xóa (Chỉ admin thấy) */}
                {userInfo?.role === 'admin' && (
                    <button
                        onClick={() => handleDelete(item._id, item.name)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-100 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition"
                        title="Xóa sản phẩm"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            </td>
        </tr>
    );


    // Render component trang sản phẩm
    return (
        <div className="space-y-4"> {/* Thêm khoảng cách giữa các element */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-semibold text-gray-800">Quản lý Sản phẩm ({productsData.total.toLocaleString('vi-VN')})</h1>
                {/* Nút Thêm mới */}
                <button
                    onClick={() => openForm(null)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition whitespace-nowrap"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Thêm Sản phẩm
                </button>
            </div>

            {/* Hiển thị lỗi nếu có */}
            {error && <ErrorDisplay message={error} onDismiss={() => setError('')} />}

            {/* Thanh tìm kiếm */}
            <form onSubmit={handleSearchSubmit} className="mt-4 mb-2">
                <div className="relative rounded-md shadow-sm">
                    <input
                        type="text"
                        name="search"
                        id="search"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-10 sm:text-sm border-gray-300 rounded-md py-2"
                        placeholder="Tìm kiếm theo tên sản phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {/* Có thể thêm icon Search ở đây nếu muốn */}
                        <button type="submit" className="text-gray-400 hover:text-gray-500 focus:outline-none">
                            {/* <SearchIcon className="h-5 w-5" /> */}
                            {/* Hoặc nút text */}
                            <span className='text-sm font-medium text-indigo-600 hover:text-indigo-500'>Tìm</span>
                        </button>
                    </div>
                </div>
            </form>


            {/* Component DataTable */}
            <DataTable
                headers={['Ảnh', 'Tên SP', 'SKU', 'Giá', 'Tồn kho', 'Ngày tạo', 'Hành động']}
                items={productsData.items}
                renderRow={renderProductRow}
                loading={loading}
                emptyMessage="Không tìm thấy sản phẩm nào."
            />

            {/* Component Pagination */}
            <Pagination
                currentPage={productsData.page}
                totalPages={productsData.pages}
                onPageChange={(page) => fetchData(page, searchTerm)} // Truyền cả search term khi đổi trang
            />

            {/* Component FormModal (Sẽ tạo ở bước sau) */}
            {showFormModal && (
                <FormModal
                    isOpen={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    item={editingItem}
                    formType={'product'} // Xác định loại form
                    onSubmit={editingItem ? handleUpdate : handleCreate} // Hàm submit tương ứng
                    loading={loading} // Truyền trạng thái loading cho modal
                />
            )}
        </div>
    );
}

export default ProductsPage;
