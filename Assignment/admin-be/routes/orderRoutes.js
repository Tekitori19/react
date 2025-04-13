// routes/orderRoutes.js
const express = require('express');
const {
    getOrders, getOrderById, updateOrderStatus
    // ,deleteOrder // Không nên có delete order
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

const router = express.Router();

// Tất cả route order cần đăng nhập (admin hoặc staff)
router.use(protect, authorize('admin', 'staff'));

// GET /api/orders
router.route('/')
    .get(getOrders);

// GET /api/orders/:id
// PUT /api/orders/:id/status (thường không có PUT /api/orders/:id trực tiếp)
router.route('/:id')
    .get(getOrderById);

// Route riêng để cập nhật status
router.put('/:id/status', updateOrderStatus);

// router.delete('/:id', deleteOrder); // Bỏ qua delete

module.exports = router;
