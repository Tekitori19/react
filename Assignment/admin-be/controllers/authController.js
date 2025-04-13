// controllers/authController.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
// const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants'); // Hoặc lấy từ .env
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// @desc    Authenticate staff & get token
// @route   POST /api/auth/login
// @access  Public
const loginStaff = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400); throw new Error('Vui lòng cung cấp tên đăng nhập và mật khẩu');
    }

    const staff = await Staff.findOne({ username });

    if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined.');
        res.status(500); throw new Error('Server configuration error.');
    }


    // Kiểm tra staff tồn tại, tài khoản active và mật khẩu khớp
    if (staff && staff.is_active && (await staff.matchPassword(password))) {
        // Tạo payload cho token
        const payload = { staffId: staff._id, role: staff.role };
        // Tạo token
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // Trả về thông tin cơ bản và token
        res.json({
            _id: staff._id,
            username: staff.username,
            full_name: staff.full_name,
            email: staff.email,
            role: staff.role,
            token: token,
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Tên đăng nhập hoặc mật khẩu không hợp lệ, hoặc tài khoản đã bị khóa');
    }
});

// @desc    Get current logged in staff profile
// @route   GET /api/auth/me
// @access  Private (Protect middleware sẽ gắn req.staff)
const getMe = asyncHandler(async (req, res) => {
    // Thông tin staff đã được lấy và gắn vào req.staff bởi middleware 'protect'
    const staff = req.staff;
    if (staff) {
        // Trả về thông tin cần thiết (trừ password_hash đã bị loại bỏ)
         res.json({
             _id: staff._id,
             username: staff.username,
             full_name: staff.full_name,
             email: staff.email,
             role: staff.role,
             is_active: staff.is_active,
             createdAt: staff.createdAt,
         });
    } else {
        // Trường hợp này ít khi xảy ra nếu 'protect' hoạt động đúng
         res.status(404);
         throw new Error('Không tìm thấy thông tin nhân viên');
    }
});

module.exports = {
    loginStaff,
    getMe,
};
