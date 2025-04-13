// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Staff = require('../models/Staff'); // Đi đường dẫn tương đối đến model
// const { JWT_SECRET } = require('../config/constants'); // Nếu tạo file constants
const JWT_SECRET = process.env.JWT_SECRET; // Lấy trực tiếp từ .env

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!JWT_SECRET) {
                console.error('JWT_SECRET is not defined in environment variables.');
                res.status(500);
                throw new Error('Server configuration error');
            }
            const decoded = jwt.verify(token, JWT_SECRET);
            req.staff = await Staff.findById(decoded.staffId).select('-password_hash'); // Tìm staff bằng ID trong token

            if (!req.staff) {
                res.status(401);
                throw new Error('Not authorized, staff not found');
            }
            if (!req.staff.is_active) {
                res.status(401);
                throw new Error('Not authorized, staff account is inactive');
            }

            next(); // Cho phép đi tiếp
        } catch (error) {
             // Handle specific JWT errors
             if (error.name === 'JsonWebTokenError') {
                 console.error('JWT Error:', error.message);
                 res.status(401);
                 throw new Error('Not authorized, invalid token');
             } else if (error.name === 'TokenExpiredError') {
                 console.error('JWT Expired:', error.message);
                 res.status(401);
                 throw new Error('Not authorized, token expired');
             } else {
                 // Rethrow other errors or handle specifically
                 console.error('Token verification failed:', error);
                 res.status(401);
                throw new Error('Not authorized, token failed');
            }
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});

module.exports = { protect };
