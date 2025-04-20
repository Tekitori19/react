// routes/userRoutes.js
const express = require('express');
const {
    getUsers, getUserById, updateUserStatus, deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorizeMiddleware');

const router = express.Router();

router.use(protect); // Bảo vệ tất cả route user

// GET /api/users - Xem danh sách (admin, staff)
router.route('/')
    .get(authorize('admin', 'staff'), getUsers);

// GET /api/users/:id - Xem chi tiết (admin, staff)
// DELETE /api/users/:id - Xóa user (chỉ admin)
router.route('/:id')
    .get(authorize('admin', 'staff'), getUserById)
    .delete(authorize('admin', 'staff'), deleteUser);

// PUT /api/users/:id/status - Cập nhật trạng thái (chỉ admin?)
router.put('/:id/status', authorize('admin', 'staff'), updateUserStatus); // <-- Chỉ Admin đổi status User

module.exports = router;
