// controllers/dashboardController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Staff = require('../models/Staff');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { getDateRange } = require('../utils/helpers'); // Import helper (Sẽ tạo ở bước sau)


// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats/summary
// @access  Private (Admin/Staff)
const getDashboardSummary = asyncHandler(async (req, res) => {
    const [
         totalRevenueData, activeUsers, totalOrders,
        pendingOrders, lowStockCountResult
     ] = await Promise.all([
        Order.aggregate([
            { $match: { status: { $in: ['delivered', 'shipped'] }, payment_status: 'paid' } },
             { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
        ]),
         User.countDocuments({ is_active: true }),
         Order.countDocuments(),
         Order.countDocuments({ status: 'pending' }),
         Product.countDocuments({ stock_quantity: { $lt: 10 } })
     ]);

    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;
    res.json({
        totalRevenue, activeUsers, totalOrders, pendingOrders,
        lowStockProducts: lowStockCountResult
    });
});

// @desc    Get order count by status
// @route   GET /api/dashboard/stats/order-status
// @access  Private (Admin/Staff)
const getOrderStatusStats = asyncHandler(async (req, res) => {
    const statusCounts = await Order.aggregate([
         { $group: { _id: '$status', count: { $sum: 1 } } },
         { $project: { status: '$_id', count: 1, _id: 0 } },
         { $sort: { status: 1 } } // Sắp xếp theo tên status
     ]);
     res.json(statusCounts);
});

// @desc    Get daily revenue and orders (last month)
// @route   GET /api/dashboard/stats/revenue-orders-daily
// @access  Private (Admin/Staff)
const getDailyRevenueAndOrders = asyncHandler(async (req, res) => {
    const period = req.query.period || 'month'; // Lấy period từ query hoặc mặc định là tháng
     const { start, end } = getDateRange(period); // Sử dụng helper

    const dailyData = await Order.aggregate([
         { $match: { order_date: { $gte: start, $lte: end }, status: { $in: ['delivered', 'shipped', 'processing'] }, payment_status: 'paid' } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$order_date", timezone: "Asia/Ho_Chi_Minh" } }, totalRevenue: { $sum: '$total_amount' }, orderCount: { $sum: 1 } } }, // Thêm timezone nếu cần
        { $sort: { _id: 1 } },
         { $project: { date: '$_id', revenue: '$totalRevenue', orders: '$orderCount', _id: 0 } }
     ]);
     res.json(dailyData);
 });

// @desc    Get product count by stock level
// @route   GET /api/dashboard/stats/product-stock
// @access  Private (Admin/Staff)
const getProductStockStats = asyncHandler(async (req, res) => {
    const stockLevels = await Product.aggregate([
         { $group: { _id: null, lowStock: { $sum: { $cond: [ { $lt: ["$stock_quantity", 10] }, 1, 0 ] } }, mediumStock: { $sum: { $cond: [ { $and: [ { $gte: ["$stock_quantity", 10] }, { $lt: ["$stock_quantity", 50] } ] }, 1, 0 ] } }, highStock: { $sum: { $cond: [ { $gte: ["$stock_quantity", 50] }, 1, 0 ] } } } },
        { $project: { _id: 0, low: '$lowStock', medium: '$mediumStock', high: '$highStock' } }
    ]);
    res.json(stockLevels[0] || { low: 0, medium: 0, high: 0 });
 });

// @desc    Seed database with fake data (Admin Only, USE WITH CAUTION)
// @route   POST /api/seed
// @access  Private/Admin
const seedDatabase = asyncHandler(async (req, res) => {
    // Giữ nguyên logic seed phức tạp đã có ở file server.js gốc
     // Copy toàn bộ nội dung bên trong `app.post('/api/seed', ...)` vào đây
     // Đảm bảo các hằng số như NUM_USERS,... được định nghĩa
     // Đảm bảo đã require các Model và mongoose
     console.log('WARNING: Running data seeder via API. Deleting existing data.');
     const NUM_USERS = 50, NUM_STAFF = 5, NUM_PRODUCTS = 100, NUM_ORDERS = 200;
     try {
        // --- 1. Delete old data ---
        await Order.deleteMany(); /*...*/ await User.deleteMany();
        console.log('Old data destroyed.');

         // --- 2. Create Users ---
         const usersData = []; /*...*/
        const createdUsers = await User.insertMany(usersData);
        console.log(`${createdUsers.length} Users generated.`);
        const createdUserIds = createdUsers.map(u => u._id);

         // --- 3. Create Staff ---
         const staffData = []; /*...*/ const createdStaffIds = [];
         // Create admin
         const admin = new Staff({/*...*/ password_hash: 'admin123' /*...*/ });
        const savedAdmin = await admin.save(); createdStaffIds.push(savedAdmin._id);
         // Create test staff
        const testStaff = new Staff({/*...*/ password_hash: 'staff123' /*...*/ });
         const savedTestStaff = await testStaff.save(); createdStaffIds.push(savedTestStaff._id);
         // Create faker staff
         for (let i = 0; i < NUM_STAFF; i++) { /*...*/ staffData.push({/*...*/ password_hash: 'staffpass' /*...*/}); }
         for (const staffMember of staffData) { try { /*...*/ const savedStaff = await newStaff.save(); createdStaffIds.push(savedStaff._id); } catch(err) {/*...*/} }
         console.log(`${createdStaffIds.length} Staff generated.`);

         // --- 4. Create Products ---
         const productsData = []; /*...*/
         const createdProducts = await Product.insertMany(productsData);
        console.log(`${createdProducts.length} Products generated.`);
         const createdProductIds = createdProducts.map(p => p._id);
         const productMap = new Map(); createdProducts.forEach(p => productMap.set(p._id.toString(), {/*...*/}));

         // --- 5. Create Orders ---
         const ordersData = [];
        for (let i = 0; i < NUM_ORDERS; i++) { /*... Logic tạo order phức tạp ...*/ }
        const createdOrders = await Order.insertMany(ordersData);
         console.log(`${createdOrders.length} Orders generated.`);

         // --- 6. Update Stock ---
         console.log("Updating actual product stock..."); /*...*/
         await Promise.all(Array.from(productMap.entries()).map(([productId, productInfo]) =>
             Product.findByIdAndUpdate(productId, { stock_quantity: productInfo.stock })
         ));
         console.log(`Updated stock for ${productMap.size} products.`);


        console.log('---- DATA SEEDING COMPLETE ----');
         res.status(201).json({ /*... Response thành công ...*/ });
    } catch (error) {
         console.error('Error seeding data:', error); /*...*/
         res.status(500).json({ /*... Response lỗi ...*/ });
    }
 });

module.exports = {
    getDashboardSummary,
    getOrderStatusStats,
    getDailyRevenueAndOrders,
    getProductStockStats,
    seedDatabase, // Export hàm seed
 };
