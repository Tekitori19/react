// controllers/dashboardController.js
const mongoose = require('mongoose');             // Cần thiết cho ObjectId
const asyncHandler = require('express-async-handler'); // Xử lý lỗi async
const Order = require('../models/Order');           // Model Order
const Product = require('../models/Product');       // Model Product
const User = require('../models/User');             // Model User
const Staff = require('../models/Staff');           // Model Staff
const { faker } = require('@faker-js/faker');     // Thư viện tạo dữ liệu giả
const { getDateRange } = require('../utils/helpers'); // Hàm tiện ích lấy khoảng ngày

// --- Controllers cho API Thống kê ---

/**
 * @desc    Lấy số liệu thống kê tóm tắt cho dashboard.
 * @route   GET /api/dashboard/stats/summary
 * @access  Private (Admin/Staff)
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
    // Sử dụng Promise.all để thực hiện các truy vấn đồng thời
    const [
        totalRevenueData, // Kết quả aggregate cho tổng doanh thu
        activeUsers,      // Số lượng user đang active
        totalOrders,      // Tổng số đơn hàng
        pendingOrders,    // Số đơn hàng đang chờ xử lý
        lowStockCountResult // Số sản phẩm sắp hết hàng
    ] = await Promise.all([
        // 1. Tính tổng doanh thu (chỉ từ đơn delivered/shipped và đã paid)
        Order.aggregate([
            // $match: Lọc các đơn hàng phù hợp điều kiện
            { $match: { status: { $in: ['delivered', 'shipped'] }, payment_status: 'paid' } },
            // $group: Nhóm tất cả document lại và tính tổng 'total_amount'
            { $group: { _id: null, totalRevenue: { $sum: '$total_amount' } } }
        ]),
        // 2. Đếm số user đang active
        User.countDocuments({ is_active: true }),
        // 3. Đếm tổng số đơn hàng
        Order.countDocuments(),
        // 4. Đếm số đơn hàng có trạng thái 'pending'
        Order.countDocuments({ status: 'pending' }),
        // 5. Đếm số sản phẩm có số lượng tồn kho dưới 10
        Product.countDocuments({ stock_quantity: { $lt: 10 } })
    ]);

    // Lấy kết quả totalRevenue từ aggregate (nó trả về mảng) hoặc mặc định là 0
    const totalRevenue = totalRevenueData.length > 0 ? totalRevenueData[0].totalRevenue : 0;

    // Trả về kết quả tổng hợp dạng JSON
    res.json({
        totalRevenue: totalRevenue,         // Tổng doanh thu
        activeUsers: activeUsers,           // Số khách hàng active
        totalOrders: totalOrders,           // Tổng số đơn hàng
        pendingOrders: pendingOrders,       // Số đơn hàng đang chờ
        lowStockProducts: lowStockCountResult // Số sản phẩm sắp hết hàng
    });
});

/**
 * @desc    Lấy số lượng đơn hàng theo từng trạng thái.
 * @route   GET /api/dashboard/stats/order-status
 * @access  Private (Admin/Staff)
 */
const getOrderStatusStats = asyncHandler(async (req, res) => {
    const statusCounts = await Order.aggregate([
        // $group: Nhóm các đơn hàng theo trường 'status' và đếm số lượng trong mỗi nhóm
        { $group: { _id: '$status', count: { $sum: 1 } } },
        // $project: Định dạng lại output, đổi tên trường _id thành status, chỉ giữ lại status và count
        { $project: { status: '$_id', count: 1, _id: 0 } },
        // $sort: Sắp xếp kết quả theo tên trạng thái (tùy chọn)
        { $sort: { status: 1 } }
    ]);
    res.json(statusCounts); // Trả về mảng các object { status: '...', count: ... }
});

/**
 * @desc    Lấy tổng doanh thu và số lượng đơn hàng thành công hàng ngày trong một khoảng thời gian.
 * @route   GET /api/dashboard/stats/revenue-orders-daily
 * @access  Private (Admin/Staff)
 */
const getDailyRevenueAndOrders = asyncHandler(async (req, res) => {
    // Lấy khoảng thời gian từ query parameter 'period' (vd: 'week', 'month') hoặc mặc định 'month'
    const period = req.query.period || 'month';
    // Sử dụng helper function để lấy ngày bắt đầu và kết thúc
    const { start, end } = getDateRange(period);

    const dailyData = await Order.aggregate([
        // $match: Lọc các đơn hàng trong khoảng thời gian, đã thành công (vd: delivered, shipped, processing tùy logic) và đã thanh toán
        {
            $match: {
                order_date: { $gte: start, $lte: end }, // Trong khoảng ngày
                status: { $in: ['delivered', 'shipped', 'processing'] }, // Các trạng thái tính doanh thu
                payment_status: 'paid' // Phải được thanh toán
            }
        },
        // $group: Nhóm theo ngày (định dạng YYYY-MM-DD), tính tổng doanh thu và đếm số đơn mỗi ngày
        {
            $group: {
                // Sử dụng $dateToString để trích xuất ngày và định dạng, set timezone nếu cần
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$order_date", timezone: "Asia/Ho_Chi_Minh" } },
                totalRevenue: { $sum: '$total_amount' }, // Tính tổng doanh thu
                orderCount: { $sum: 1 }                 // Đếm số đơn
            }
        },
        // $sort: Sắp xếp kết quả theo ngày tăng dần
        { $sort: { _id: 1 } },
        // $project: Định dạng lại output, đổi tên _id thành date, và giữ lại các trường cần thiết
        { $project: { date: '$_id', revenue: '$totalRevenue', orders: '$orderCount', _id: 0 } }
    ]);
    res.json(dailyData); // Trả về mảng các object { date: '...', revenue: ..., orders: ... }
});

/**
 * @desc    Lấy số lượng sản phẩm theo mức tồn kho (Thấp, Trung bình, Cao).
 * @route   GET /api/dashboard/stats/product-stock
 * @access  Private (Admin/Staff)
 */
const getProductStockStats = asyncHandler(async (req, res) => {
    const stockLevels = await Product.aggregate([
        {
            // $group: Nhóm tất cả sản phẩm lại (_id: null)
            $group: {
                _id: null,
                // Đếm số SP tồn kho thấp (< 10) bằng $cond
                lowStock: { $sum: { $cond: [{ $lt: ["$stock_quantity", 10] }, 1, 0] } },
                // Đếm số SP tồn kho trung bình (10 <= stock < 50)
                mediumStock: { $sum: { $cond: [{ $and: [{ $gte: ["$stock_quantity", 10] }, { $lt: ["$stock_quantity", 50] }] }, 1, 0] } },
                // Đếm số SP tồn kho cao (>= 50)
                highStock: { $sum: { $cond: [{ $gte: ["$stock_quantity", 50] }, 1, 0] } }
            }
        },
        // $project: Loại bỏ _id và giữ lại các trường đếm với tên dễ hiểu hơn
        { $project: { _id: 0, low: '$lowStock', medium: '$mediumStock', high: '$highStock' } }
    ]);
    // Trả về object kết quả, hoặc object mặc định nếu không có sản phẩm nào
    res.json(stockLevels[0] || { low: 0, medium: 0, high: 0 });
});

// --- Controller để Seed dữ liệu ---

/**
 * @desc    Xóa dữ liệu cũ và tạo dữ liệu mẫu mới bằng Faker.
 * @route   POST /api/dashboard/seed
 * @access  Private (Admin only) - Rất nguy hiểm, chỉ dùng cho development!
 */
const seedDatabase = asyncHandler(async (req, res) => {
    console.log('\x1b[33m%s\x1b[0m', 'WARNING: Running data seeder via API. This will DELETE existing data in the database!'); // Màu vàng cảnh báo

    // Định nghĩa số lượng dữ liệu cần tạo
    const NUM_USERS = parseInt(req.query.users) || 50;
    const NUM_STAFF = parseInt(req.query.staff) || 5; // (excluding fixed admin/test staff)
    const NUM_PRODUCTS = parseInt(req.query.products) || 100;
    const NUM_ORDERS = parseInt(req.query.orders) || 200;

    try {
        // === Bước 1: Xóa dữ liệu cũ ===
        console.log("Deleting existing data...");
        await Order.deleteMany({}); // Xóa hết Order
        await Product.deleteMany({}); // Xóa hết Product
        await Staff.deleteMany({});   // Xóa hết Staff
        await User.deleteMany({});    // Xóa hết User
        console.log("\x1b[32m%s\x1b[0m", "Old data successfully destroyed.");

        // === Bước 2: Tạo Khách hàng (Users) ===
        console.log(`Generating ${NUM_USERS} users...`);
        const usersData = [];
        for (let i = 0; i < NUM_USERS; i++) {
            usersData.push({
                username: faker.internet.userName().toLowerCase().replace(/[\W_]+/g, "") + faker.string.alphanumeric(4), // Username sạch hơn
                email: faker.internet.email().toLowerCase(),
                full_name: faker.person.fullName(),
                phone_number: faker.phone.number('0#########'), // SĐT Việt Nam
                address: faker.location.streetAddress(true),
                is_active: faker.datatype.boolean(0.9), // 90% active
            });
        }
        const createdUsers = await User.insertMany(usersData);
        const createdUserIds = createdUsers.map(u => u._id); // Lấy ID để tạo Order
        console.log("\x1b[32m%s\x1b[0m", `${createdUsers.length} Users generated.`);

        // === Bước 3: Tạo Nhân viên (Staff) ===
        console.log(`Generating ${NUM_STAFF + 2} staff (admin, test + random)...`);
        const staffData = [];
        const createdStaffIds = [];

        // -- Tạo tài khoản cố định --
        // 1. Admin gốc
        try {
            const admin = new Staff({ username: 'admin', password_hash: 'admin123', full_name: 'Admin Chính', role: 'admin', email: 'admin@shop.local', is_active: true });
            const savedAdmin = await admin.save(); createdStaffIds.push(savedAdmin._id);
        } catch (error) { console.error("Error creating fixed admin:", error.message); }
        // 2. Staff test
        try {
            const testStaff = new Staff({ username: 'teststaff', password_hash: 'staff123', full_name: 'Staff Test', role: 'staff', email: 'staff@shop.local', is_active: true });
            const savedTestStaff = await testStaff.save(); createdStaffIds.push(savedTestStaff._id);
        } catch (error) { console.error("Error creating fixed test staff:", error.message); }

        // -- Tạo tài khoản ngẫu nhiên --
        for (let i = 0; i < NUM_STAFF; i++) {
            staffData.push({
                username: faker.internet.userName().toLowerCase().replace(/[\W_]+/g, "") + faker.string.alphanumeric(3),
                password_hash: faker.internet.password(), // Password ngẫu nhiên (sẽ hash)
                full_name: faker.person.fullName(),
                role: 'staff',
                email: faker.internet.email().toLowerCase(),
                is_active: faker.datatype.boolean(0.85),
            });
        }
        // Hash và lưu từng staff ngẫu nhiên
        for (const staffMember of staffData) {
            try {
                const newStaff = new Staff(staffMember);
                const savedStaff = await newStaff.save();
                createdStaffIds.push(savedStaff._id);
            } catch (err) {
                // Thường là lỗi trùng key (username/email)
                console.warn(`Skipping staff due to potential duplicate key for ${staffMember.username}: ${err.message}`);
            }
        }
        console.log("\x1b[32m%s\x1b[0m", `${createdStaffIds.length} Staff generated (including fixed accounts).`);

        // === Bước 4: Tạo Sản phẩm (Products) ===
        console.log(`Generating ${NUM_PRODUCTS} products...`);
        const productsData = [];
        const categories = ['Áo thun', 'Áo sơ mi', 'Quần jeans', 'Quần kaki', 'Giày sneaker', 'Giày tây', 'Balo', 'Túi xách', 'Đồng hồ', 'Kính mắt'];
        for (let i = 0; i < NUM_PRODUCTS; i++) {
            const category = faker.helpers.arrayElement(categories);
            const name = `${category} ${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()} #${faker.string.alphanumeric(4)}`;
            productsData.push({
                name: name,
                description: faker.commerce.productDescription(),
                price: faker.number.int({ min: 50000, max: 5000000 }), // Giá int cho dễ
                stock_quantity: faker.number.int({ min: 0, max: 200 }),
                image_url: faker.image.urlLoremFlickr({ category: 'fashion', width: 640, height: 480, lock: i }), // Thêm lock để ảnh khác nhau
                sku: `SKU${faker.string.alphanumeric(8).toUpperCase()}`,
            });
        }
        const createdProducts = await Product.insertMany(productsData);
        const createdProductIds = createdProducts.map(p => p._id); // Lấy ID sản phẩm
        // Tạo Map để theo dõi tồn kho tạm thời và thông tin sp khi tạo đơn hàng
        const productMap = new Map();
        createdProducts.forEach(p => productMap.set(p._id.toString(), {
            stock: p.stock_quantity,
            price: p.price,
            name: p.name // Lưu tên để dùng khi tạo order item
        }));
        console.log("\x1b[32m%s\x1b[0m", `${createdProducts.length} Products generated.`);


        // === Bước 5: Tạo Đơn hàng (Orders) ===
        console.log(`Generating ${NUM_ORDERS} orders...`);
        const ordersData = [];
        if (createdUserIds.length === 0 || createdProductIds.length === 0) {
            console.warn("Cannot create orders: No users or products available.");
        } else {
            for (let i = 0; i < NUM_ORDERS; i++) {
                const randomUserId = faker.helpers.arrayElement(createdUserIds);
                const numItems = faker.number.int({ min: 1, max: 5 }); // 1-5 items/order
                const orderItems = [];
                let totalAmount = 0;
                let orderPossible = true; // Cờ kiểm tra
                const currentProductStock = new Map(productMap); // Copy map stock cho đơn hàng này

                for (let j = 0; j < numItems; j++) {
                    // Tìm một sản phẩm ngẫu nhiên còn hàng trong kho tạm thời
                    let attempts = 0;
                    let validProductFound = false;
                    const productIdsAvailable = Array.from(currentProductStock.keys());

                    while (attempts < productIdsAvailable.length) { // Chỉ thử các sp còn trong map tạm
                        const randomProductId = faker.helpers.arrayElement(productIdsAvailable);
                        const productInfo = currentProductStock.get(randomProductId);

                        if (productInfo && productInfo.stock > 0) {
                            // Tìm thấy SP hợp lệ
                            const quantity = faker.number.int({ min: 1, max: Math.min(3, productInfo.stock) }); // Số lượng mua

                            orderItems.push({
                                product_id: new mongoose.Types.ObjectId(randomProductId),
                                name: productInfo.name, // Lấy tên đã lưu
                                quantity: quantity,
                                price_at_purchase: productInfo.price // Lấy giá đã lưu
                            });
                            totalAmount += quantity * productInfo.price;

                            // Giảm số lượng tồn kho tạm thời
                            productInfo.stock -= quantity;
                            currentProductStock.set(randomProductId, productInfo); // Cập nhật lại map tạm

                            validProductFound = true;
                            break; // Thoát vòng while tìm sản phẩm
                        }
                        attempts++;
                    } // end while tìm sp

                    if (!validProductFound) {
                        // Nếu không tìm được sp phù hợp sau khi thử hết -> có thể đơn hàng này không tạo được item nữa
                        // Nếu chưa có item nào thì hủy luôn đơn hàng này
                        if (orderItems.length === 0) {
                            orderPossible = false;
                        }
                        break; // Thoát vòng for j (thêm items)
                    }
                } // end for j (thêm items)

                // Chỉ tạo đơn hàng nếu có thể và có ít nhất 1 item
                if (orderPossible && orderItems.length > 0) {
                    // Cập nhật map tồn kho chính (productMap) từ map tạm (currentProductStock)
                    currentProductStock.forEach((value, key) => {
                        productMap.set(key, value); // Ghi đè giá trị stock mới vào map chính
                    });

                    // Quyết định status, payment status...
                    const status = faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed']);
                    let payment_status = 'pending';
                    // Logic gán payment status dựa trên order status (ví dụ)
                    if (['delivered', 'shipped', 'processing'].includes(status)) payment_status = faker.helpers.arrayElement(['paid', 'pending']);
                    else if (['cancelled', 'failed'].includes(status)) payment_status = faker.helpers.arrayElement(['failed', 'pending']);

                    // Ngày đặt hàng trong quá khứ
                    const orderDate = faker.date.past({ years: 1 }); // Tối đa 1 năm trước

                    // Lấy thông tin KH gốc (để tránh gọi DB nhiều lần)
                    const customer = createdUsers.find(u => u._id.equals(randomUserId));

                    ordersData.push({
                        user_id: randomUserId,
                        // Chỉ gán staff ngẫu nhiên (không phải admin/teststaff) nếu có staff ngẫu nhiên được tạo
                        staff_id: createdStaffIds.length > 2 ? faker.helpers.maybe(() => faker.helpers.arrayElement(createdStaffIds.slice(2)), { probability: 0.6 }) : null,
                        order_items: orderItems,
                        total_amount: totalAmount,
                        status: status,
                        shipping_address: faker.helpers.maybe(() => faker.location.streetAddress(true), { probability: 0.1 }) || customer?.address || 'N/A', // 10% địa chỉ khác
                        customer_name: customer?.full_name || 'Unknown Customer',
                        customer_email: customer?.email || 'unknown@example.com',
                        customer_phone: customer?.phone_number,
                        payment_method: faker.helpers.arrayElement(['COD', 'Bank Transfer', 'Credit Card', 'E-Wallet']),
                        payment_status: payment_status,
                        notes: faker.helpers.maybe(() => faker.lorem.sentences(faker.number.int({ min: 1, max: 2 })), { probability: 0.1 }), // 10% có note
                        order_date: orderDate,
                        createdAt: orderDate, // Ghi đè createdAt
                        updatedAt: faker.date.between({ from: orderDate, to: new Date() }) // updatedAt sau orderDate
                    });
                } // end if orderPossible
            } // end for i (orders)
        } // end else (có user/product)

        // Insert các đơn hàng hợp lệ vào DB
        let createdOrders = [];
        if (ordersData.length > 0) {
            createdOrders = await Order.insertMany(ordersData);
        }
        console.log("\x1b[32m%s\x1b[0m", `${createdOrders.length} Orders generated.`);

        // === Bước 6: Cập nhật số lượng tồn kho thực tế vào DB ===
        // Dùng productMap đã cập nhật ở bước tạo Order
        console.log("Updating actual product stock quantities in DB...");
        const stockUpdatePromises = Array.from(productMap.entries()).map(([productId, productInfo]) =>
            Product.findByIdAndUpdate(productId, { stock_quantity: productInfo.stock }, { new: false }) // Chỉ cần update, không cần trả về doc mới
        );
        await Promise.all(stockUpdatePromises); // Chờ tất cả update hoàn tất
        console.log("\x1b[32m%s\x1b[0m", `Updated stock for ${productMap.size} products.`);


        // === Hoàn thành ===
        console.log('---- DATA SEEDING COMPLETE ----');
        res.status(201).json({
            message: `Seed data generated successfully! (${NUM_USERS}U, ${createdStaffIds.length}S, ${NUM_PRODUCTS}P, ${createdOrders.length}O)`,
            counts: {
                users: createdUsers.length,
                staff: createdStaffIds.length,
                products: createdProducts.length,
                orders: createdOrders.length
            }
        });

    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', 'Error during data seeding:'); // Màu đỏ cho lỗi
        console.error(error);
        if (error.code === 11000) { // Lỗi trùng key
            console.error("\x1b[31m%s\x1b[0m", "Duplicate key error encountered. Please check unique constraints.", error.keyValue);
        }
        res.status(500).json({
            message: 'Data seeding failed.',
            error: error.message,
            // stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
    }
});

// --- Exports ---
module.exports = {
    getDashboardSummary,
    getOrderStatusStats,
    getDailyRevenueAndOrders,
    getProductStockStats,
    seedDatabase,
};
