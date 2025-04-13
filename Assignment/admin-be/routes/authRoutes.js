// routes/authRoutes.js
const express = require('express');
const { loginStaff, getMe } = require('../controllers/authController'); // Import controller
const { protect } = require('../middleware/authMiddleware'); // Import middleware protect

const router = express.Router();

router.post('/login', loginStaff); // Route đăng nhập
router.get('/me', protect, getMe);   // Route lấy thông tin user, cần protect

module.exports = router; // Export router
