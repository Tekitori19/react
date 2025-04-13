// controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Model khách hàng
const mongoose = require('mongoose'); // Để check ID hợp lệ

// @desc    Get all users with pagination
// @route   GET /api/users
// @access  Private (Admin/Staff)
const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const query = {}; // Thêm filter nếu cần

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

    res.json({
         users: users, page: page,
        pages: Math.ceil(totalUsers / limit), total: totalUsers
    });
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin/Staff)
const getUserById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('ID khách hàng không hợp lệ');
    }
    const user = await User.findById(req.params.id);
    if (user) {
        res.json(user);
    } else {
        res.status(404); throw new Error('Không tìm thấy khách hàng');
    }
});

// @desc    Update user status (active/inactive)
// @route   PUT /api/users/:id/status
// @access  Private (Admin/Staff) - Thường chỉ Admin nên làm việc này
const updateUserStatus = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         res.status(400); throw new Error('ID khách hàng không hợp lệ');
     }
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('Không tìm thấy khách hàng'); }

    const { is_active } = req.body;
    if (is_active === undefined) {
        res.status(400); throw new Error('Trường is_active là bắt buộc');
    }
    // Cập nhật trạng thái và lưu
     user.is_active = Boolean(is_active); // Chuyển về boolean
     const updatedUser = await user.save();
     res.json(updatedUser); // Trả về user đã cập nhật
});

// @desc    Delete a user (use with caution!)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
         res.status(400); throw new Error('ID khách hàng không hợp lệ');
     }
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); throw new Error('Không tìm thấy khách hàng'); }

    // Cân nhắc logic trước khi xóa: Kiểm tra đơn hàng liên quan? Hoặc chỉ nên set inactive?
    await user.deleteOne(); // Dùng deleteOne
    res.json({ message: 'Khách hàng đã được xóa' });
});

// Không có hàm tạo User từ dashboard (thường user tự đăng ký)

module.exports = {
    getUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
};
