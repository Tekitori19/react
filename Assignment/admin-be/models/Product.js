// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    stock_quantity: { type: Number, required: true, default: 0, min: 0 },
    image_url: String,
    sku: { type: String, unique: true, sparse: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
