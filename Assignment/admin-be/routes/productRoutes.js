// routes/productRoutes.js
const express = require('express');
const {
    getProducts, getProductById, createProduct, updateProduct, deleteProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

const router = express.Router();

// Áp dụng 'protect' cho tất cả các route sản phẩm
router.use(protect);

// GET /api/products - Cả admin và staff đều xem được
// POST /api/products - Admin tạo (hoặc cả staff tùy yêu cầu)
router.route('/')
    .get(authorize('admin', 'staff'), getProducts)
    .post(authorize('admin'), createProduct); // <-- Chỉ Admin tạo SP

// GET /api/products/:id - Cả admin và staff xem được
// PUT /api/products/:id - Admin sửa (hoặc cả staff)
// DELETE /api/products/:id - Chỉ Admin xóa
router.route('/:id')
    .get(authorize('admin', 'staff'), getProductById)
    .put(authorize('admin'), updateProduct)     // <-- Chỉ Admin sửa SP
    .delete(authorize('admin'), deleteProduct); // <-- Chỉ Admin xóa SP

module.exports = router;
