// controllers/orderController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product'); // Có thể cần để cập nhật stock
const User = require('../models/User'); // Có thể cần nếu lấy thông tin user
const Staff = require('../models/Staff'); // Có thể cần nếu lấy thông tin staff
const mongoose = require('mongoose');

// @desc    Get all orders with pagination
// @route   GET /api/orders
// @access  Private (Admin/Staff)
const getOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const query = {}; // Add filters for status, user, date range etc. here
    // Ví dụ filter:
    // if (req.query.status) query.status = req.query.status;
    // if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) query.user_id = req.query.userId;
    // if (req.query.startDate && req.query.endDate) {
    //     query.order_date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    // }

    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
        // Populate để lấy thông tin liên quan (chỉ lấy trường cần thiết)
         .populate('user_id', 'full_name email') // Lấy tên, email người đặt
        .populate('staff_id', 'full_name') // Lấy tên người xử lý
        .sort({ order_date: -1 }) // Mặc định mới nhất trước
        .limit(limit)
        .skip(skip);

    res.json({
        orders: orders, page: page,
        pages: Math.ceil(totalOrders / limit), total: totalOrders
    });
});

// @desc    Get a single order by ID with details
// @route   GET /api/orders/:id
// @access  Private (Admin/Staff)
const getOrderById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         res.status(400); throw new Error('ID đơn hàng không hợp lệ');
     }

     // Populate sâu hơn để lấy chi tiết
    const order = await Order.findById(req.params.id)
        .populate('user_id', 'full_name username email phone_number address') // Nhiều thông tin user hơn
        .populate('staff_id', 'full_name username') // Thêm username staff
        // Populate cả thông tin product bên trong order_items nếu cần thiết ở BE
         // Tuy nhiên, FE có thể fetch riêng lẻ nếu cần chi tiết sp mới nhất
         .populate('order_items.product_id', 'name sku image_url'); // Ví dụ lấy tên, sku, ảnh gốc SP

     if (order) {
        res.json(order);
    } else {
        res.status(404); throw new Error('Không tìm thấy đơn hàng');
    }
});

// @desc    Update order status, payment status, notes, assign staff
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Staff)
const updateOrderStatus = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         res.status(400); throw new Error('ID đơn hàng không hợp lệ');
    }
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Không tìm thấy đơn hàng'); }

     const { status, payment_status, notes } = req.body; // Lấy các trường cần update
    const allowedOrderStatuses = Order.schema.path('status').enumValues;
     const allowedPaymentStatuses = Order.schema.path('payment_status').enumValues;

     let updated = false; // Cờ kiểm tra xem có gì được update không

     // Update trạng thái đơn hàng nếu hợp lệ
     if (status && allowedOrderStatuses.includes(status)) {
        // Có thể thêm logic nghiệp vụ ở đây
        // Ví dụ: không cho chuyển từ delivered về processing
        // Ví dụ: khi hủy đơn thì cộng lại stock? (Cẩn thận race condition)
        if (order.status !== status) {
            order.status = status;
            updated = true;
            // await handleStockUpdateOnStatusChange(order, oldStatus, status); // Tách logic xử lý stock
        }
    }

     // Update trạng thái thanh toán nếu hợp lệ
     if (payment_status && allowedPaymentStatuses.includes(payment_status)) {
        if (order.payment_status !== payment_status) {
             order.payment_status = payment_status;
            updated = true;
         }
    }

     // Update ghi chú (cho phép cả chuỗi rỗng)
    if (notes !== undefined && order.notes !== notes) {
        order.notes = notes;
        updated = true;
     }

    // Gán nhân viên xử lý là người đang thực hiện nếu đơn hàng chưa có ai xử lý
     if (!order.staff_id && req.staff) { // req.staff từ middleware 'protect'
         order.staff_id = req.staff._id;
        updated = true;
     }


    if (updated) {
        const updatedOrder = await order.save();
        // Populate lại thông tin để trả về FE nếu cần
         await updatedOrder.populate('user_id', 'full_name email');
         await updatedOrder.populate('staff_id', 'full_name');
         res.json(updatedOrder);
    } else {
        res.status(304); // Not Modified - Không có gì để update
        // hoặc trả về thông báo lỗi nhẹ nhàng
         // res.status(400).json({ message: 'Không có thay đổi hợp lệ được cung cấp.' });
    }
});

// Thường không nên có API xóa Order từ dashboard

module.exports = {
    getOrders,
    getOrderById,
    updateOrderStatus,
};

/* // Helper xử lý stock (Ví dụ - cần test kỹ)
async function handleStockUpdateOnStatusChange(order, oldStatus, newStatus) {
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') { // Khi đơn bị hủy
        console.log(`Restocking items for cancelled order ${order._id}`);
         for (const item of order.order_items) {
             await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_quantity: item.quantity } });
        }
    } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') { // Khi đơn được khôi phục từ hủy (ít xảy ra)
         console.log(`Reducing stock for reactivated order ${order._id}`);
         for (const item of order.order_items) {
            // Kiểm tra tồn kho trước khi trừ
            await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_quantity: -item.quantity } });
         }
    }
     // Thêm logic cho các status khác nếu cần (vd: khi delivered?)
} */
