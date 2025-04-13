// models/Order.js
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    // Tham chiếu đến Product nhưng không cần populate sâu trong nhiều trường hợp ở BE
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price_at_purchase: { type: Number, required: true },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    order_items: [OrderItemSchema],
    total_amount: { type: Number, required: true },
    status: { type: String, required: true, default: 'pending', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'] },
    shipping_address: { type: String, required: true },
    customer_name: { type: String, required: true },
    customer_email: { type: String, required: true },
    customer_phone: { type: String },
    payment_method: String,
    payment_status: { type: String, required: true, default: 'pending', enum: ['pending', 'paid', 'failed'] },
    notes: String,
    order_date: { type: Date, default: Date.now }, // Giữ lại để tiện query/sort
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
