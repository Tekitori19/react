// routes/dashboardRoutes.js
const express = require('express');
const {
    getDashboardSummary, getOrderStatusStats,
    getDailyRevenueAndOrders, getProductStockStats, seedDatabase
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

const router = express.Router();

// Áp dụng bảo vệ và phân quyền cho các route thống kê
router.use(protect, authorize('admin', 'staff'));

router.get('/stats/summary', getDashboardSummary);
router.get('/stats/order-status', getOrderStatusStats);
router.get('/stats/revenue-orders-daily', getDailyRevenueAndOrders);
router.get('/stats/product-stock', getProductStockStats);

// Route seed chỉ dành cho admin và tách riêng
router.post('/seed', authorize('admin'), seedDatabase); // Chỉ admin được chạy seed

module.exports = router;
