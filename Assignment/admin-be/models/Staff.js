// models/Staff.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- Cần require bcrypt ở đây

const StaffSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'staff'], default: 'staff' },
    email: { type: String, required: true, unique: true },
    phone_number: String,
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

StaffSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
        next();
    } catch (err) {
        next(err);
    }
});

StaffSchema.methods.matchPassword = async function (enteredPassword) {
    // Đảm bảo password_hash tồn tại trước khi so sánh
    if (!this.password_hash) return false;
    return await bcrypt.compare(enteredPassword, this.password_hash);
};

module.exports = mongoose.model('Staff', StaffSchema);
